import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedBillingSummary(property_id: string, currentMonth: number, currentYear: number) {
    "use cache";
    cacheLife("hours");
    cacheTag(`billing-summary-${property_id}`);

    const [rows]: any = await db.query(
        `
      SELECT 
        b.billing_id,
        u.unit_name,
        b.total_amount_due,
        b.status,
        b.due_date,
        b.billing_period,
        b.created_at
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      WHERE u.property_id = ?
        AND MONTH(b.created_at) = ?
        AND YEAR(b.created_at) = ?
      ORDER BY b.created_at DESC
      `,
        [property_id, currentMonth, currentYear]
    );

    return rows;
}

export async function GET(req: NextRequest) {
    try {
        const property_id = req.nextUrl.searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json(
                { error: "Missing property_id" },
                { status: 400 }
            );
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const rows = await getCachedBillingSummary(property_id, currentMonth, currentYear);

        if (!rows.length) {
            return NextResponse.json(
                { message: "No billing records found for this month." },
                { status: 404 }
            );
        }

        const html = `
<html>
  <head>
    <style>
      body {
        font-family: 'Inter', 'Arial', sans-serif;
        color: #1f2937;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
      }

      header {
        background: linear-gradient(90deg, #10b981, #2563eb);
        color: white;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      header h1 {
        font-size: 20px;
        margin: 0;
        font-weight: 700;
      }
      header img {
        height: 28px;
      }

      .content {
        padding: 16px 24px;
      }
      h2 {
        text-align: left;
        color: #1e40af;
        font-size: 18px;
        margin-bottom: 4px;
      }
      p.subtext {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th, td {
        border-bottom: 1px solid #e5e7eb;
        padding: 8px 10px;
        text-align: left;
      }
      th {
        background-color: #f3f4f6;
        color: #111827;
        font-weight: 600;
      }
      tr:nth-child(even) {
        background-color: #fafafa;
      }

      .summary-info {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
        font-size: 13px;
        line-height: 1.4;
      }
      .summary-info strong {
        color: #2563eb;
      }

      footer {
        margin-top: 32px;
        padding: 10px 0;
        text-align: center;
        color: white;
        font-size: 12px;
        background: linear-gradient(90deg, #2563eb, #10b981);
      }
    </style>
  </head>

  <body>
    <header>
      <h1>UpKyp Billing Summary</h1>
      <img src="https://upkyp.s3.amazonaws.com/assets/upkyp-logo-light.png" alt="UpKyp Logo" />
    </header>

    <div class="content">
      <h2>Billing Summary – ${now.toLocaleString("default", {
            month: "long",
        })} ${currentYear}</h2>
      <p class="subtext">
        This report contains the complete list of unit billings for this property generated
        in the current month. It includes billing IDs, status, due dates, and total payable amounts.
      </p>

      <div class="summary-info">
        <p><strong>Property ID:</strong> ${property_id}</p>
        <p><strong>Total Units Billed:</strong> ${rows.length}</p>
        <p><strong>Generated On:</strong> ${new Date().toLocaleString("en-PH", {
            dateStyle: "long",
            timeStyle: "short",
        })}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Billing ID</th>
            <th>Unit Name</th>
            <th>Billing Period</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Total Amount (₱)</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
                (r: any) => `
              <tr>
                <td>${r.billing_id}</td>
                <td>${r.unit_name}</td>
                <td>${r.billing_period ? new Date(r.billing_period).toLocaleDateString("en-PH") : "-"}</td>
                <td>${r.due_date ? new Date(r.due_date).toLocaleDateString("en-PH") : "-"}</td>
                <td>${r.status}</td>
                <td>${r.total_amount_due?.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                })}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <footer>
      Ⓒ ${new Date().getFullYear()} UpKyp Property Management System — Empowering Landlords with Automation
    </footer>
  </body>
</html>
`;

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
        });

        await browser.close();

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Billing_Summary_${currentMonth}_${currentYear}.pdf"`,
            },
        });
    } catch (error) {
        console.error("❌ PDF generation failed:", error);
        return NextResponse.json(
            { error: "Failed to generate billing summary." },
            { status: 500 }
        );
    }
}
