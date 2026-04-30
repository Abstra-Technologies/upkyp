import { db } from "@/lib/db";

export async function generateSubscriptionBillingSnapshots() {
    try {
        const [activeSubscriptions]: any = await db.execute(`
            SELECT
                s.subscription_id,
                s.landlord_id,
                s.plan_code,
                p.plan_id,
                p.price AS base_price
            FROM Subscription s
            JOIN Plan p ON s.plan_code = p.plan_code
            WHERE s.subscription_status = 'active'
        `);

        if (!activeSubscriptions.length) {
            console.log("No active subscriptions to bill.");
            return 0;
        }

        const billingMonth = new Date();
        billingMonth.setDate(1);
        billingMonth.setHours(0, 0, 0, 0);
        const billingMonthStr = billingMonth.toISOString().split("T")[0];

        let processedCount = 0;

        for (const sub of activeSubscriptions) {
            const [existingSnapshot]: any = await db.execute(
                `SELECT snapshot_id FROM SubscriptionMonthlyBillingSnapshot 
                 WHERE subscription_id = ? AND billing_month = ?`,
                [sub.subscription_id, billingMonthStr]
            );

            if (existingSnapshot.length > 0) {
                console.log(`Snapshot already exists for subscription ${sub.subscription_id}, month ${billingMonthStr}`);
                continue;
            }

            const [unitPriceRows]: any = await db.execute(
                `SELECT property_type, unit_price FROM PlanUnitPriceByPropertyType WHERE plan_id = ?`,
                [sub.plan_id]
            );

            const unitPricesByType: Record<string, number> = {};
            unitPriceRows.forEach((row: any) => {
                unitPricesByType[row.property_type] = Number(row.unit_price);
            });

            const [properties]: any = await db.execute(
                `SELECT p.property_type, COUNT(u.unit_id) AS unit_count
                 FROM Property p
                 LEFT JOIN Unit u ON p.property_id = u.property_id
                 WHERE p.landlord_id = ?
                 GROUP BY p.property_type`,
                [sub.landlord_id]
            );

            let totalUnits = 0;
            let totalUnitCost = 0;
            let weightedAvgUnitPrice = 0;

            properties.forEach((row: any) => {
                const type = row.property_type || "N/A";
                const count = Number(row.unit_count) || 0;
                const price = Number(unitPricesByType[type]) || 0;
                totalUnits += count;
                totalUnitCost += count * price;
            });

            if (totalUnits > 0) {
                weightedAvgUnitPrice = totalUnitCost / totalUnits;
            }

            const basePrice = Number(sub.base_price);
            const totalComputed = totalUnitCost;
            const finalCharge = Math.max(basePrice, totalComputed);

            await db.execute(
                `INSERT INTO SubscriptionMonthlyBillingSnapshot 
                 (subscription_id, billing_month, units_used, applied_floor_price, applied_unit_price, total_computed, final_charge)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [sub.subscription_id, billingMonthStr, totalUnits, basePrice, weightedAvgUnitPrice, totalComputed, finalCharge]
            );

            processedCount++;
            console.log(`Snapshot created for subscription ${sub.subscription_id}: ${totalUnits} units, ₱${finalCharge} charge`);
        }
        console.log(`Generated ${processedCount} billing snapshots.`);
        return processedCount;
    } catch (error) {
        console.error("Error generating subscription billing snapshots:", error);
        throw error;
    }
}
