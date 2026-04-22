import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agreementId = searchParams.get("agreement_id");

  if (!agreementId) {
    return NextResponse.json(
      { error: "Missing agreement_id" },
      { status: 400 }
    );
  }

  try {
    const [leaseRows]: any = await db.query(
      `SELECT la.unit_id, u.property_id, u.unit_name,
              p.water_billing_type, p.electricity_billing_type
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE la.agreement_id = ?
       LIMIT 1`,
      [agreementId]
    );

    if (!leaseRows.length) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const lease = leaseRows[0];
    const { unit_id, water_billing_type, electricity_billing_type } = lease;

    const isWaterSubmetered = water_billing_type === "submetered";
    const isElectricSubmetered = electricity_billing_type === "submetered";

    const result: any = {
      water: { submetered: isWaterSubmetered, data: null },
      electricity: { submetered: isElectricSubmetered, data: null },
    };

    if (isWaterSubmetered) {
      const [waterRows]: any = await db.query(
        `SELECT * FROM WaterMeterReading
         WHERE unit_id = ?
         ORDER BY period_end DESC
         LIMIT 3`,
        [unit_id]
      );
      result.water.data = waterRows;
    }

    if (isElectricSubmetered) {
      const [electricRows]: any = await db.query(
        `SELECT * FROM ElectricMeterReading
         WHERE unit_id = ?
         ORDER BY period_end DESC
         LIMIT 3`,
        [unit_id]
      );
      result.electricity.data = electricRows;
    }

    if (!isWaterSubmetered && !isElectricSubmetered) {
      return NextResponse.json({ submetered: false }, { status: 200 });
    }

    return NextResponse.json({ submetered: true, ...result }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching utility consumption:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
