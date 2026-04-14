// app/landlord/properties/units/[unitId]/opengraph-image.tsx

import { ImageResponse } from "next/og";
import axios from "axios";

export const runtime = "edge";

export const alt = "Rental Unit Preview";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { unitId: string } }) {
    const { unitId } = params;

    let propertyName = "Unnamed Property";
    let unitName = "Unnamed Unit";
    let backgroundImageUrl = null;

    try {
        const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`
        );
        const prop = res.data?.propertyDetails;
        if (prop) {
            propertyName = prop.property_name || propertyName;
            unitName = prop.unit_name || unitName;
            if (prop.photos?.[0]?.photo_url) {
                // Ensure absolute URL
                backgroundImageUrl = prop.photos[0].photo_url.startsWith("http")
                    ? prop.photos[0].photo_url
                    : `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}${prop.photos[0].photo_url}`;
            }
        }
    } catch (error) {
        console.error("Failed to fetch unit data for OG image:", error);
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: backgroundImageUrl
                        ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImageUrl}) center/cover`
                        : "linear-gradient(to bottom right, #1e40af, #10b981)",
                    color: "white",
                    fontSize: 60,
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "80px",
                }}
            >
                <div style={{ fontSize: 100 }}>🏠 FOR RENT</div>
                <div style={{ marginTop: 40, fontSize: 80 }}>
                    {unitName}
                </div>
                <div style={{ marginTop: 20, fontSize: 60 }}>
                    at {propertyName}
                </div>
                <div style={{ marginTop: 60, fontSize: 40 }}>
                    Modern living with great amenities • Ready for move-in!
                </div>
                <div style={{ position: "absolute", bottom: 40, fontSize: 30 }}>
                    Rentalley.com
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}