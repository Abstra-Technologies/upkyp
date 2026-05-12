import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return new NextResponse("Unit ID is required", { status: 400 });
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT
                u.unit_name,
                u.qr_code_url,
                p.property_name
            FROM Unit u
            JOIN Property p ON u.property_id = p.property_id
            WHERE u.unit_id = ?
              AND u.qr_code_url IS NOT NULL
            `,
            [unit_id]
        );

        if (!rows || rows.length === 0) {
            return new NextResponse("QR not found for this unit", {
                status: 404,
            });
        }

        const { unit_name, qr_code_url, property_name } = rows[0];

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Unit QR</title>
    <meta charset="utf-8" />
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, Helvetica, sans-serif;

            /* Gradient background */
            background: linear-gradient(
                135deg,
                #ecfeff 0%,
                #f0fdf4 50%,
                #f8fafc 100%
            );
        }

        /* Half A4 size (A5) */
        .sheet {
            width: 148mm;
            height: 210mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .card {
            background: #ffffff;
            border-radius: 18px;
            padding: 36px 40px;
            text-align: center;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.10);
        }

        .brand {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .tagline {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 22px;
        }

        .qr-wrapper {
            background: #f1f5f9;
            border-radius: 14px;
            padding: 16px;
            display: inline-block;
            margin-bottom: 18px;
        }

        img {
            width: 260px;
            height: 260px;
        }

        h1 {
            font-size: 20px;
            margin: 0;
            color: #020617;
        }

        p {
            margin-top: 6px;
            font-size: 14px;
            color: #475569;
        }

        .hint {
            margin-top: 14px;
            font-size: 12px;
            color: #94a3b8;
        }

        .actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
        }

        .btn {
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            border: none;
            cursor: pointer;
        }

        .btn-print {
            background: #0f172a;
            color: #fff;
        }

        .btn-download {
            background: #e2e8f0;
            color: #020617;
        }

        @media print {
            body {
                background: #fff;
            }
            .actions {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="card" id="qr-card">
            <div class="brand">UPKYP</div>
            <div class="tagline">Connect more, manage less</div>

            <div class="qr-wrapper">
                <img id="qr-img" src="${qr_code_url}" alt="Unit QR Code" />
            </div>

            <h1>${property_name}</h1>
            <p>Unit: ${unit_name}</p>
            <div class="hint">Scan to access this unit</div>

            <div class="actions">
                <button class="btn btn-print" onclick="window.print()">
                    Print
                </button>
                <button class="btn btn-download" onclick="downloadImage()">
                    Download Image
                </button>
            </div>
        </div>
    </div>

    <script>
        function downloadImage() {
            const card = document.getElementById('qr-card');

            const canvas = document.createElement('canvas');
            const scale = 2; // higher resolution
            const rect = card.getBoundingClientRect();

            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = document.getElementById('qr-img').src;

            img.onload = () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, rect.width, rect.height);
                ctx.drawImage(img, 80, 120, 260, 260);

                const link = document.createElement('a');
                link.download = 'unit-qr.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
        }
    </script>
</body>
</html>
`;

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("❌ Print QR Error:", error);
        return new NextResponse("Server error", { status: 500 });
    }
}
