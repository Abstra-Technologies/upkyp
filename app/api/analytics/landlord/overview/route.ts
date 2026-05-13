import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedOverview(landlord_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`landlord-overview-${landlord_id}`);

    const [activeRows] = await db.query(
        `SELECT COUNT(*) AS activeListings 
   FROM Property 
   WHERE landlord_id = ? AND status = 'active'`,
        [landlord_id]
    );

    const [pendingRows] = await db.query(
        `SELECT COUNT(*) AS pendingListings 
   FROM Property 
   WHERE landlord_id = ? AND status = 'inactive'`,
        [landlord_id]
    );

    const [tenantRows] = await db.query(
        `SELECT COUNT(DISTINCT la.tenant_id) AS totalTenants
   FROM LeaseAgreement la
   JOIN Unit u ON la.unit_id = u.unit_id
   JOIN Property p ON u.property_id = p.property_id
   WHERE p.landlord_id = ? AND la.status IN ('active','completed')`,
        [landlord_id]
    );

    const [propertyCount] = await db.query(
        `SELECT COUNT(property_id) AS numberOfProperties
   FROM Property 
   WHERE landlord_id = ?`,
        [landlord_id]
    );

    const [maintenanceRows] = await db.query(
        `SELECT 
      category AS name,
      COUNT(*) AS count
   FROM MaintenanceRequest mr
   JOIN Unit u ON mr.unit_id = u.unit_id
   JOIN Property p ON u.property_id = p.property_id
   WHERE p.landlord_id = ?
   GROUP BY category`,
        [landlord_id]
    );

    const [occupationRows] = await db.query(
        `SELECT
             u.occupation AS label,
             COUNT(*) AS value
         FROM User u
                  JOIN Tenant t ON u.user_id = t.user_id
                  JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
                  JOIN Unit un ON la.unit_id = un.unit_id
                  JOIN Property p ON un.property_id = p.property_id
         WHERE p.landlord_id = ?
           AND u.occupation IS NOT NULL
           AND u.occupation != ''
         GROUP BY u.occupation
         ORDER BY COUNT(*) DESC`,
        [landlord_id]
    );

    const [ageRows] = await db.query(
        `SELECT 
    CASE
      WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) < 25 THEN '18-24'
      WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
      WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
      WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 45 AND 54 THEN '45-54'
      ELSE '55+' 
    END AS ageGroup,
    COUNT(*) AS count
   FROM User u
   JOIN Tenant t ON u.user_id = t.user_id
   JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
   JOIN Unit un ON la.unit_id = un.unit_id
   JOIN Property p ON un.property_id = p.property_id
   WHERE p.landlord_id = ?
   GROUP BY ageGroup`,
        [landlord_id]
    );

    return {
        activeListings: activeRows[0]?.activeListings || 0,
        pendingListings: pendingRows[0]?.pendingListings || 0,
        totalTenants: tenantRows[0]?.totalTenants || 0,
        numberOfProperties: propertyCount[0]?.numberOfProperties || 0,
        maintenanceCategories: maintenanceRows || [],
        tenantOccupation: occupationRows || [],
        tenantAgeGroups: ageRows || []
    };
}

export async function GET(req: Request) {
    try {
        const landlord_id = new URL(req.url).searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        const response = await getCachedOverview(landlord_id);
        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching landlord overview analytics:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}