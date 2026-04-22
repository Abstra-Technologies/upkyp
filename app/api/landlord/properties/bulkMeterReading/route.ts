import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (!session.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { readings } = body;

        if (!Array.isArray(readings) || readings.length === 0) {
            return NextResponse.json(
                { error: "No readings provided." },
                { status: 400 }
            );
        }

        const results: any[] = [];
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            for (const reading of readings) {
                const { lease_id, electric_previous, electric_current, water_previous, water_current, period_start, period_end } = reading;

                // Verify lease belongs to landlord's property
                const [leaseRows]: any = await connection.query(
                    `SELECT la.agreement_id AS lease_id, la.unit_id, u.property_id, p.landlord_id
                     FROM LeaseAgreement la
                     JOIN Unit u ON la.unit_id = u.unit_id
                     JOIN Property p ON u.property_id = p.property_id
                     WHERE la.agreement_id = ? AND p.landlord_id = ?`,
                    [lease_id, session.landlord_id]
                );

                if (leaseRows.length === 0) {
                    results.push({ lease_id, success: false, error: "Lease not found or access denied" });
                    continue;
                }

                const lease = leaseRows[0];
                const unit_id = lease.unit_id;

                // Use provided period_start/period_end
                const elecPeriodStart = period_start || null;
                const elecPeriodEnd = period_end || new Date().toISOString().split("T")[0];
                const waterPeriodStart = period_start || null;
                const waterPeriodEnd = period_end || new Date().toISOString().split("T")[0];

                if (electric_current) {
                    const prevReading = electric_previous ? Number(electric_previous) : 0;
                    const currReading = Number(electric_current);

                    await connection.query(
                        `INSERT INTO ElectricMeterReading 
                         (lease_id, unit_id, period_start, period_end, previous_reading, current_reading) 
                         VALUES (?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                         previous_reading = VALUES(previous_reading),
                         current_reading = VALUES(current_reading),
                         updated_at = NOW()`,
                        [lease_id, unit_id, elecPeriodStart, elecPeriodEnd, prevReading, currReading]
                    );

                    results.push({ lease_id, unit_id, success: true, type: "electric" });
                }

                if (water_current) {
                    const prevReading = water_previous ? Number(water_previous) : 0;
                    const currReading = Number(water_current);

                    await connection.query(
                        `INSERT INTO WaterMeterReading 
                         (lease_id, unit_id, period_start, period_end, previous_reading, current_reading) 
                         VALUES (?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                         previous_reading = VALUES(previous_reading),
                         current_reading = VALUES(current_reading),
                         updated_at = NOW()`,
                        [lease_id, unit_id, waterPeriodStart, waterPeriodEnd, prevReading, currReading]
                    );

                    results.push({ lease_id, unit_id, success: true, type: "water" });
                }
            }

            await connection.commit();

            return NextResponse.json({
                success: true,
                message: "Meter readings saved successfully.",
                results,
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error saving meter readings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
