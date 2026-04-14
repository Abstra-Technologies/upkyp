
import { Metadata } from "next";
import PropertyDetails from "@/components/find-rent/PropertyDetails";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/properties/findRent/viewPropertyDetails?id=${params.id}`,
      { cache: "no-store" }
  );

  if (!res.ok) {
    return {
      title: "Property Not Found | FindRent",
      description: "We couldn't find the property you're looking for.",
    };
  }

  const property = await res.json();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://rent-alley-web.vercel.app"),
    title: `${property.property_name} | FindRent`,
    description:
        property.description?.slice(0, 150) ||
        "Check out this rental property on Upkyp.",

    openGraph: {
      title: property.property_name,
      description:
          property.description?.slice(0, 150) ||
          "Check out this rental property on Upkyp.",
      url: property.share_url,
      type: "website",
      images: [
        {
          url: property.main_photo,
          width: 1200,
          height: 630,
          alt: property.property_name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: property.property_name,
      description:
          property.description?.slice(0, 150) ||
          "Check out this rental property on Upkyp.",
      images: [property.main_photo],
    },
  };
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  // @ts-ignore
  return <PropertyDetails id={params.id} />;
}
