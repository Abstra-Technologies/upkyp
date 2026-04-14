import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Find Rent | Browse Properties for Rent - UpKyp",
    template: "%s | UpKyp",
  },
  description:
    "Search rental units including apartments, condos, dorms, and rooms for rent in the Philippines. Find your perfect home with UpKyp.",
  keywords: [
    "rent",
    "apartment",
    "condo",
    "room for rent",
    "Philippines",
    "property rental",
    "Metro Manila",
    "Cebu",
    "Davao",
    "affordable housing",
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
    canonical: "/pages/find-rent",
  },
  openGraph: {
    title: "Find Rent | Browse Properties for Rent - UpKyp",
    description:
      "Search rental units including apartments, condos, dorms, and rooms for rent in the Philippines.",
    url: "/pages/find-rent",
    siteName: "UpKyp",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Rent | Browse Properties for Rent - UpKyp",
    description:
      "Search rental units including apartments, condos, dorms, and rooms for rent in the Philippines.",
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
  verification: {
    // Add your verification tokens here if needed
    // google: 'your-google-verification-token',
  },
};

export default function FindRentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
