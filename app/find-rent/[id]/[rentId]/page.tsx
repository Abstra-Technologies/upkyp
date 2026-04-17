import { Metadata } from "next";
import PropertyUnitDetailedPage from "./PropertyUnitDetailedPage";

function getBaseUrl() {
    const url = process.env.NEXT_PUBLIC_BASE_URL;

    // must include scheme
    if (url && url.startsWith("http")) {
        return url;
    }

    // safe dev fallback
    return "https://upkyp.com";
}


export async function generateMetadata(
    { params }: { params: Promise<{ id: string; rentId: string }> }
): Promise<Metadata> {

    const { id, rentId } = await params;

    const baseUrl = getBaseUrl();

    try {
        const res = await fetch(
            `${baseUrl}/api/properties/findRent/viewPropUnitDetails?rentId=${rentId}`,
            { next: { revalidate: 3600 } }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch unit details");
        }

        const unit = await res.json();

        const ogImageUrl =
            `${baseUrl}/api/og/unit?` +
            `unit=${encodeURIComponent(`Unit ${unit.unit_name}`)}&` +
            `property=${encodeURIComponent(unit.property_name)}&` +
            `rent=${encodeURIComponent(
                `₱${Number(unit.rent_amount).toLocaleString()}`
            )}&` +
            `image=${encodeURIComponent(unit.photos?.[0] || "")}`;

        const title = `Unit ${unit.unit_name} – ${unit.property_name}`;
        const description = `Rent this unit for ₱${Number(
            unit.rent_amount
        ).toLocaleString()} per month in ${unit.city}, ${unit.province}.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url: `${baseUrl}/find-rent/${id}/${rentId}`,
                siteName: "Upkyp",
                type: "website",
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${unit.unit_name} at ${unit.property_name}`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [ogImageUrl],
            },
        };
    } catch (error) {
        console.error("Metadata generation error:", error);

        return {
            title: "Unit Details - Upkyp",
            description: "View unit details and rent this property",
        };
    }
}


export default function Page() {
  return (
      <PropertyUnitDetailedPage />
  );
}