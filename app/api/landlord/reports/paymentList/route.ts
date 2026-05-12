import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: Request) {
    const session = await getSessionUser();
    if (!session || session.userType !== "landlord") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const landlord_id = session.landlord_id;
    const { searchParams } = new URL(req.url);

    const property_id = searchParams.get("property_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    console.log('property id: ', property_id);
    console.log('year: ', year);
    console.log('month: ', month);

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    /* =========================
       BUILD QUERY
    ========================== */
    let query = `
    SELECT 
      p.payment_id, 
      p.transaction_id,
      pr.property_name, 
      p.payment_type, 
      p.amount_paid, 
      p.payment_status, 
      p.payment_date, 
      p.receipt_reference
    FROM Payment p
    JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
    JOIN Unit u ON u.unit_id = la.unit_id
    JOIN Property pr ON pr.property_id = u.property_id
    WHERE pr.landlord_id = ?
  `;

    const params: any[] = [landlord_id];

    if (property_id) {
        query += " AND pr.property_id = ?";
        params.push(property_id);
    }

    if (year) {
        query += " AND YEAR(p.payment_date) = ?";
        params.push(year);
    }

    if (year && month) {
        query += " AND MONTH(p.payment_date) = ?";
        params.push(Number(month));
    }

    query += " ORDER BY p.payment_date DESC";

    const [rows]: any = await db.query(query, params);

    /* =========================
       HEADER LABELS
    ========================== */
    const now = new Date();

    const monthLabel =
        year && month
            ? new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
            })
            : year
                ? year
                : "All Periods";

    const propertyLabel =
        property_id && rows.length
            ? rows[0].property_name
            : "All Properties";

    /* =========================
       PDF CONTENT
    ========================== */
    const html = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #111827;
          }
          .brand {
            text-align: center;
            margin-bottom: 10px;
          }
          .brand h1 {
            margin: 0;
            font-size: 26px;
            color: #2563eb;
            letter-spacing: 0.5px;
          }
          .brand p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
          }
          .title {
            text-align: center;
            margin-top: 18px;
          }
          .title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .title h3 {
            margin: 4px 0 0;
            font-size: 13px;
            font-weight: normal;
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px;
          }
          th {
            background-color: #f3f4f6;
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #6b7280;
            margin-top: 32px;
          }
        </style>
      </head>
      <body>

        <!-- BRAND -->
        <div class="brand">
          <h1>Upkyp</h1>
          <p>Connect More Manage Less</p>
        </div>

        <!-- REPORT TITLE -->
        <div class="title">
          <h2>Payment Transaction History</h2>
          <h3>${propertyLabel} &mdash; ${monthLabel}</h3>
        </div>

        <!-- TABLE -->
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Type</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Date Paid</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            ${
        rows.length
            ? rows
                .map(
                    (r: any) => `
                        <tr>
                          <td>${r.payment_id}</td>
                          <td>${r.property_name}</td>
                          <td>${r.payment_type}</td>
                          <td>${formatCurrency(r.amount_paid)}</td>
                          <td>${r.payment_status}</td>
                          <td>${formatDate(r.payment_date)}</td>
                          <td>${r.receipt_reference || "—"}</td>
                        </tr>
                      `
                )
                .join("")
            : `
                  <tr>
                    <td colspan="7" style="text-align:center; padding:16px;">
                      No payment records found.
                    </td>
                  </tr>
                `
    }
          </tbody>
        </table>

        <div class="footer">
          Generated by Upkyp • ${now.toLocaleString()}
        </div>

      </body>
    </html>
  `;

    /* =========================
       GENERATE PDF
    ========================== */
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px",
        },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Payment_Transaction_History.pdf"`,
        },
    });
}
