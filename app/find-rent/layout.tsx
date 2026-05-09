import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Apartment & Condo for Rent in Philippines | Find Your Home - UpKyp",
    template: "%s | UpKyp",
  },
  description:
    "Find apartments, condos, rooms, and dormitories for rent in Quezon City, Manila, Makati, and across the Philippines. Browse verified rental listings with photos, prices, and direct landlord contact. Your next home is one search away.",
  keywords: [
    "apartment for rent",
    "condo for rent",
    "room for rent",
    "apartment for rent in quezon city",
    "condo for rent in manila",
    "affordable apartment for rent",
    "room for rent in makati",
    "dormitory for rent",
    "apartment for rent philippines",
    "rental properties quezon city",
    "apartments near me",
    "cheap apartment for rent",
    "studio apartment for rent",
    "1 bedroom apartment for rent",
    "2 bedroom apartment for rent",
    "furnished apartment for rent",
    "unfurnished apartment for rent",
    "UpKyp",
  ],
  authors: [{ name: "UpKyp" }],
  creator: "UpKyp",
  publisher: "UpKyp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://upkyp.com"),
  alternates: {
    canonical: "/find-rent",
  },
  openGraph: {
    title: "Apartment & Condo for Rent in Philippines | UpKyp",
    description:
      "Find apartments, condos, rooms for rent in Quezon City, Manila, Makati, and across the Philippines. Browse verified listings with photos and direct landlord contact.",
    url: "/find-rent",
    siteName: "UpKyp",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/og-find-rent.png",
        width: 1200,
        height: 630,
        alt: "Find rental properties in the Philippines - UpKyp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apartment & Condo for Rent in Philippines | UpKyp",
    description:
      "Find apartments, condos, rooms for rent in Quezon City, Manila, Makati, and across the Philippines.",
    images: ["/og-find-rent.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
  category: "Real Estate",
  other: {
    "geo.region": "PH",
    "geo.country": "PH",
  },
};

export default function FindRentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
