import { db } from "@/lib/db"; 
import { decryptData } from "@/crypto/encrypt";
import { NextRequest } from "next/server";
// @ts-ignore
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ property_id: string }> }
)
{
    const { property_id } = await context.params;

  if (!property_id) {
    return new Response(
      JSON.stringify({ message: "Missing property ID" }),
      { status: 400 }
    );
  }

  try {
    const [photoRows]: any = await db.execute(
      `SELECT DISTINCT photo_url FROM PropertyPhoto WHERE property_id = ? ORDER BY photo_id ASC`,
      [property_id]
    );

    if (photoRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No photos found for this property." }),
        { status: 404 }
      );
    }

    const photos = photoRows
      .map((row: any) =>
        decryptData(JSON.parse(row.photo_url), process.env.ENCRYPTION_SECRET!)
      )
      .filter((photo: string | null) => photo !== null);

    return new Response(JSON.stringify({ photos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Database Server Error" }),
      { status: 500 }
    );
  }
}
