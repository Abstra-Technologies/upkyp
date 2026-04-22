import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAdmin(req);
        if ("error" in auth) {
            return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
        }

        if (auth.role !== "super-admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        const [rows]: any = await db.query(
            "SELECT * FROM IpAddresses ORDER BY created_at DESC"
        );

        return NextResponse.json({
            success: true,
            message: "Fetched successfully",
            data: rows,
        });
    } catch (err) {
        console.error("GET /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAdmin(req);
        if ("error" in auth) {
            return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
        }

        if (auth.role !== "super-admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        const { ip_address, label } = await req.json();
        if (!ip_address) {
            return NextResponse.json({ success: false, message: "IP address is required" }, { status: 400 });
        }

        await db.query(
            "INSERT INTO IpAddresses (ip_address, label, added_by_admin_id) VALUES (?, ?, ?)",
            [ip_address, label || null, auth.admin_id]
        );

        return NextResponse.json({ success: true, message: "IP added successfully" });
    } catch (err) {
        console.error("POST /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await verifyAdmin(req);
        if ("error" in auth) {
            return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
        }

        if (auth.role !== "super_admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Missing ID parameter" }, { status: 400 });
        }

        await db.query("DELETE FROM IpAddresses WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: "IP deleted successfully" });
    } catch (err) {
        console.error("DELETE /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
