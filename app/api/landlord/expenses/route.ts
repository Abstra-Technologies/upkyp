import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied." }, { status: 403 });
        }

        const landlord_id = session.landlord_id;
        if (!landlord_id) {
            return NextResponse.json({ error: "Landlord profile not found." }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");
        const category = searchParams.get("category");
        const start_date = searchParams.get("start_date");
        const end_date = searchParams.get("end_date");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        connection = await db.getConnection();

        let whereClauses = ["e.property_id IS NULL OR p.landlord_id = ?"];
        let params: any[] = [landlord_id];

        if (property_id) {
            whereClauses.push("e.property_id = ?");
            params.push(property_id);
        }

        if (category) {
            whereClauses.push("e.category = ?");
            params.push(category);
        }

        if (start_date) {
            whereClauses.push("DATE(e.created_at) >= ?");
            params.push(start_date);
        }

        if (end_date) {
            whereClauses.push("DATE(e.created_at) <= ?");
            params.push(end_date);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const [countResult]: any = await connection.query(
            `SELECT COUNT(*) as total FROM Expenses e LEFT JOIN Property p ON e.property_id = p.property_id ${whereSQL}`,
            params
        );
        const total = countResult[0]?.total || 0;

        const [rows]: any = await connection.query(
            `SELECT 
                e.expense_id,
                e.amount,
                e.category,
                e.description,
                e.reference_type,
                e.reference_id,
                e.created_at,
                e.property_id,
                p.property_name
            FROM Expenses e
            LEFT JOIN Property p ON e.property_id = p.property_id
            ${whereSQL}
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [totals]: any = await connection.query(
            `SELECT 
                COALESCE(SUM(e.amount), 0) as total_amount,
                e.category
            FROM Expenses e
            LEFT JOIN Property p ON e.property_id = p.property_id
            ${whereSQL}
            GROUP BY e.category`,
            params
        );

        return NextResponse.json({
            expenses: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            summary: totals,
        });
    } catch (error) {
        console.error("GET expenses error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied." }, { status: 403 });
        }

        const landlord_id = session.landlord_id;
        if (!landlord_id) {
            return NextResponse.json({ error: "Landlord profile not found." }, { status: 404 });
        }

        const body = await req.json();
        const { amount, category, description, property_id, reference_type, reference_id } = body;

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json({ error: "Valid amount is required." }, { status: 400 });
        }

        if (!category) {
            return NextResponse.json({ error: "Category is required." }, { status: 400 });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        if (property_id) {
            const [props]: any = await connection.query(
                "SELECT property_id FROM Property WHERE property_id = ? AND landlord_id = ?",
                [property_id, landlord_id]
            );
            if (props.length === 0) {
                await connection.rollback();
                return NextResponse.json({ error: "Property not found or access denied." }, { status: 403 });
            }
        }

        const [result]: any = await connection.query(
            `INSERT INTO Expenses 
            (reference_type, reference_id, amount, category, description, created_by, created_at, property_id)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                reference_type || "manual",
                reference_id || null,
                parseFloat(amount),
                category,
                description || null,
                landlord_id,
                property_id || null,
            ]
        );

        const expense_id = result.insertId;

        const [expense]: any = await connection.query(
            `SELECT 
                e.expense_id,
                e.amount,
                e.category,
                e.description,
                e.reference_type,
                e.reference_id,
                e.created_at,
                e.property_id,
                p.property_name
            FROM Expenses e
            LEFT JOIN Property p ON e.property_id = p.property_id
            WHERE e.expense_id = ?`,
            [expense_id]
        );

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Expense recorded successfully.",
                expense: expense[0],
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST expense error:", error);
        if (connection) await connection.rollback();
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}