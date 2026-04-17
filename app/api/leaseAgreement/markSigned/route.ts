//  to delete commented codes

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";


const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
    try {
        const { envelopeId, userType } = await req.json();
        console.log("marksigned envelopeId:", envelopeId);
        console.log("marksigned userType:", userType);

        if (!envelopeId || !userType) {
            return NextResponse.json(
                { error: "Missing envelopeId or userType" },
                { status: 400 }
            );
        }

        // Find the lease by envelopeId
        const [leaseRows]: any = await db.query(
            `SELECT agreement_id, unit_id, tenant_id
             FROM LeaseAgreement WHERE docusign_envelope_id = ?`,
            [envelopeId]
        );

        if (!leaseRows || leaseRows.length === 0) {
            return NextResponse.json(
                { error: "No lease found for this envelopeId" },
                { status: 404 }
            );
        }

        const agreementId = leaseRows[0].agreement_id;
        const unitId = leaseRows[0].unit_id;
        const tenantId = leaseRows[0].tenant_id;

        // Mark this signer as signed
        await db.execute(
            `UPDATE LeaseSignature
             SET status = 'signed', signed_at = NOW()
             WHERE agreement_id = ? AND role = ?`,
            [agreementId, userType.toLowerCase()]
        );

        // Get all signature statuses
        const [sigRows]: any = await db.query(
            `SELECT role, status, signed_at
             FROM LeaseSignature
             WHERE agreement_id = ?`,
            [agreementId]
        );

        const total = sigRows.length;
        const signedCount = sigRows.filter(
            (r: any) => r.status?.toLowerCase().trim() === "signed"
        ).length;

        // Fetch property + landlord info
        const [unitInfo]: any = await db.query(
            `SELECT u.unit_name, p.property_name, p.property_id, l.user_id as landlord_user_id
             FROM Unit u
                      JOIN Property p ON u.property_id = p.property_id
                      JOIN Landlord l ON p.landlord_id = l.landlord_id
             WHERE u.unit_id = ?`,
            [unitId]
        );

        const propertyName = unitInfo?.property_name || "Property";
        const unitName = unitInfo?.unit_name || "Unit";
        const propertyId = unitInfo?.property_id;
        const landlordUserId = unitInfo?.landlord_user_id;

        // Fetch tenant user_id
        const [tenantUser]: any = await db.query(
            `SELECT user_id FROM Tenant WHERE tenant_id = ?`,
            [tenantId]
        );
        const tenantUserId = tenantUser?.[0]?.user_id;

        // Prepare notification
        let notifTitle = "";
        let notifBody = "";
        const url = `/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`;
        let notifyUsers: string[] = [];

        if (signedCount === total) {
            // ✅ Lease is fully signed
            await db.execute(
                `UPDATE LeaseAgreement
                 SET status = 'active', updated_at = NOW()
                 WHERE agreement_id = ?`,
                [agreementId]
            );

            // ✅ Mark unit occupied
            await db.execute(
                `UPDATE Unit 
         SET status = 'occupied', updated_at = NOW()
         WHERE unit_id = ?`,
                [unitId]
            );

            console.log(
                `✅ Lease ${agreementId} is ACTIVE & Unit ${unitId} marked as OCCUPIED`
            );

            notifTitle = "Lease Agreement Completed";
            notifBody = `🎉 The lease for ${propertyName} - ${unitName} is now fully signed and ACTIVE.`;
            notifyUsers = [landlordUserId, tenantUserId];
        } else {
            // ⏳ Still pending
            await db.execute(
                `UPDATE LeaseAgreement
                 SET status = 'pending', updated_at = NOW()
                 WHERE agreement_id = ?`,
                [agreementId]
            );

            console.log(`⏳ Lease ${agreementId} partially signed`);

            notifTitle = "Lease Agreement Update";
            notifBody =
                userType.toLowerCase() === "landlord"
                    ? `📑 Landlord has signed the lease for ${propertyName} - ${unitName}. Waiting for Tenant to sign.`
                    : `📑 Tenant has signed the lease for ${propertyName} - ${unitName}. Waiting for Landlord to sign.`;

            notifyUsers =
                userType.toLowerCase() === "landlord"
                    ? [tenantUserId]
                    : [landlordUserId];
        }

        // Insert notifications + push for each target
        for (const userId of notifyUsers) {
            if (!userId) continue;

            // Save notification
            await db.query(
                `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                 VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
                [userId, notifTitle, notifBody, url]
            );

            // Fetch push subscriptions
            const [subs]: any = await db.query(
                `SELECT endpoint, p256dh, auth
                 FROM user_push_subscriptions
                 WHERE user_id = ?`,
                [userId]
            );

            if (subs.length > 0) {
                const payload = JSON.stringify({ title: notifTitle, body: notifBody, url });

                for (const sub of subs) {
                    const subscription = {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    };

                    try {
                        await webpush.sendNotification(subscription, payload);
                        console.log("✅ Sent push notification:", sub.endpoint);
                    } catch (err: any) {
                        console.error("❌ Failed push:", err);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await db.execute(
                                `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                                [sub.endpoint]
                            );
                            console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            status: signedCount === total ? "active" : "pending",
            message:
                signedCount === total
                    ? "Lease fully signed ✅ Lease is now active & Unit is occupied"
                    : `${userType} signed, waiting for others...`,
            signatures: sigRows,
        });
    } catch (err) {
        console.error("Error in markSigned:", err);
        return NextResponse.json(
            { error: "Failed to update lease signing", details: String(err) },
            { status: 500 }
        );
    }
}

// export async function POST(req: NextRequest) {
//     try {
//         const { envelopeId, userType } = await req.json();
//         console.log("marksigned envelopeId:", envelopeId);
//         console.log("marksigned userType:", userType);
//
//         if (!envelopeId || !userType) {
//             return NextResponse.json(
//                 { error: "Missing envelopeId or userType" },
//                 { status: 400 }
//             );
//         }
//
//         // Find the lease by envelopeId
//         const [leaseRows]: any = await db.query(
//             `SELECT agreement_id FROM LeaseAgreement WHERE docusign_envelope_id = ?`,
//             [envelopeId]
//         );
//
//         if (!leaseRows || leaseRows.length === 0) {
//             return NextResponse.json(
//                 { error: "No lease found for this envelopeId" },
//                 { status: 404 }
//             );
//         }
//
//         const agreementId = leaseRows[0].agreement_id;
//
//         // Mark this signer as signed
//         await db.execute(
//             `UPDATE LeaseSignature
//              SET status = 'signed', signed_at = NOW()
//              WHERE agreement_id = ? AND role = ?`,
//             [agreementId, userType.toLowerCase()]
//         );
//
//         // Get all signature statuses
//         const [sigRows]: any = await db.query(
//             `SELECT role, status, signed_at
//              FROM LeaseSignature
//              WHERE agreement_id = ?`,
//             [agreementId]
//         );
//
//         // Count total and signed
//         const total = sigRows.length;
//         const signedCount = sigRows.filter(
//             (r: any) => r.status?.toLowerCase().trim() === "signed"
//         ).length;
//
//         // Update LeaseAgreement status
//         if (signedCount === total) {
//             await db.execute(
//                 `UPDATE LeaseAgreement
//                  SET status = 'active', updated_at = NOW()
//                  WHERE agreement_id = ?`,
//                 [agreementId]
//             );
//             console.log(`✅ Lease ${agreementId} is now ACTIVE`);
//         } else {
//             await db.execute(
//                 `UPDATE LeaseAgreement
//                  SET status = 'pending', updated_at = NOW()
//                  WHERE agreement_id = ?`,
//                 [agreementId]
//             );
//             console.log(`⏳ Lease ${agreementId} is partially signed still pending`);
//         }
//
//         return NextResponse.json({
//             success: true,
//             status: signedCount === total ? "active" : "pending",
//             message:
//                 signedCount === total
//                     ? "Lease fully signed ✅ Lease is now active"
//                     : `${userType} signed, waiting for others...`,
//             signatures: sigRows, // return current roles + statuses
//         });
//     } catch (err) {
//         console.error("Error in markSigned:", err);
//         return NextResponse.json(
//             { error: "Failed to update lease signing", details: String(err) },
//             { status: 500 }
//         );
//     }
// }

// export async function POST(req: NextRequest) {
//     try {
//         const { envelopeId, userType } = await req.json();
//         console.log('marksigned envelopeId', envelopeId);
//         console.log('marksigned userType', userType);
//
//         if (!envelopeId || !userType) {
//             return NextResponse.json(
//                 { error: "Missing envelopeId or userType" },
//                 { status: 400 }
//             );
//         }
//
//         // 1️⃣ Find the lease by envelopeId
//         const [leaseRows]: any = await db.query(
//             `SELECT agreement_id FROM LeaseAgreement WHERE docusign_envelope_id = ?`,
//             [envelopeId]
//         );
//
//         if (!leaseRows || leaseRows.length === 0) {
//             return NextResponse.json(
//                 { error: "No lease found for this envelopeId" },
//                 { status: 404 }
//             );
//         }
//
//         const agreementId = leaseRows[0].agreement_id;
//
//         // 2️⃣ Mark this signer as signed
//         await db.execute(
//             `UPDATE LeaseSignature
//        SET status = 'signed', signed_at = NOW()
//        WHERE agreement_id = ? AND role = ?`,
//             [agreementId, userType]
//         );
//
//         // 3️⃣ Check how many signatures are completed
//         const [checkRows]: any = await db.query(
//             `SELECT COUNT(*) as total, SUM(status = 'signed') as signedCount
//        FROM LeaseSignature
//        WHERE agreement_id = ?`,
//             [agreementId]
//         );
//
//         const total = checkRows[0].total;
//         const signedCount = checkRows[0].signedCount;
//
//         // 4️⃣ Update LeaseAgreement status based on progress
//         // if (signedCount === total) {
//         //     await db.execute(
//         //         `UPDATE LeaseAgreement SET status = 'completed' WHERE agreement_id = ?`,
//         //         [agreementId]
//         //     );
//         // } else {
//         //     await db.execute(
//         //         `UPDATE LeaseAgreement SET status = 'partially_signed' WHERE agreement_id = ?`,
//         //         [agreementId]
//         //     );
//         // }
//
//         return NextResponse.json({
//             success: true,
//             message:
//                 signedCount === total
//                     ? "Lease fully signed"
//                     : `${userType} signed, waiting for others`,
//         });
//     } catch (err) {
//         console.error("🔥 Error in markSigned:", err);
//         return NextResponse.json(
//             { error: "Failed to update lease signing", details: String(err) },
//             { status: 500 }
//         );
//     }
// }


