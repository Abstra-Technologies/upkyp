import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

/**
 * GET /api/systemadmin/cms/imageList?folder=upkyp/headers/landlord
 * Fetch all images from a Cloudinary folder.
 */
export async function GET(req: Request) {
    const requestTime = new Date().toISOString();

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");

    console.log(`[${requestTime}] [CMS:ImageList] Incoming request → folder:`, folder);

    if (!folder) {
        console.warn(`[${requestTime}] [CMS:ImageList] ❌ Missing folder query parameter`);
        return NextResponse.json(
            { success: false, error: "Missing 'folder' query parameter." },
            { status: 400 }
        );
    }

    try {
        // Test connection if first call
        if (!cloudinary.config().cloud_name) {
            console.error(`[${requestTime}] [CMS:ImageList] ❌ Cloudinary not configured properly.`);
            return NextResponse.json(
                { success: false, error: "Cloudinary credentials are not configured." },
                { status: 500 }
            );
        }

        console.log(`[${requestTime}] [CMS:ImageList] 🔍 Querying Cloudinary for folder: ${folder}`);

        const results = await cloudinary.search
            .expression(`folder=${folder}`)
            .sort_by("created_at", "desc")
            .max_results(50)
            .execute();

        if (!results?.resources) {
            console.warn(`[${requestTime}] [CMS:ImageList] ⚠️ No resources found for folder: ${folder}`);
            return NextResponse.json({
                success: true,
                count: 0,
                resources: [],
                message: "No images found in this folder.",
            });
        }

        console.log(
            `[${requestTime}] [CMS:ImageList] ✅ Retrieved ${results.resources.length} image(s) from ${folder}`
        );

        return NextResponse.json({
            success: true,
            folder,
            count: results.resources.length,
            resources: results.resources.map((img: any) => ({
                public_id: img.public_id,
                secure_url: img.secure_url,
                format: img.format,
                width: img.width,
                height: img.height,
                bytes: img.bytes,
                created_at: img.created_at,
            })),
        });
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] [CMS:ImageList] ❌ Cloudinary List Error:`, error);

        // Specific debug info
        let errorMessage = "Failed to retrieve images from Cloudinary.";
        if (error.http_code === 401) errorMessage = "Invalid Cloudinary API credentials.";
        if (error.http_code === 404) errorMessage = "Folder not found in Cloudinary.";
        if (error.message?.includes("ENOTFOUND")) errorMessage = "Network error: Cloudinary unreachable.";

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                debug: {
                    type: error.name || "UnknownError",
                    message: error.message,
                    stack: error.stack,
                },
            },
            { status: 500 }
        );
    }
}
