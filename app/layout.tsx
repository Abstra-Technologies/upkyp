import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";
import FeedbackWidget from "../components/beta/FeedbackWidget";
import "leaflet/dist/leaflet.css";
import InstallPrompt from "@/components/Commons/installPrompt";
import Head from "next/head";
import CookiesPermission from "@/components/Commons/setttings/cookiesPermission";
import PushInit from "@/components/notification/pushNotifMobile";
import GoogleTranslateProvider from "@/components/GoogleTranslateProvider";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Upkyp - Rental Property Management Platform",
    description: "Manage Less. Live More. Your Rental Management Partner",
    manifest: "/manifest.json",
    icons: {
        icon: [
            {
                url: "/upkeep_blue.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/upkyp_white.png",
                media: "(prefers-color-scheme: dark)",
            },
        ],
        apple: [
            {
                url: "/upkeep_blue.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/upkyp_white.png",
                media: "(prefers-color-scheme: dark)",
            },
        ],
    },
};


export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <Head>
            <link rel="manifest" href="/manifest.json"/>
            <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            <link rel="preconnect" href="https://res.cloudinary.com" />
            <meta name="theme-color" content="#ffffff"/>
            <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.matchMedia('(display-mode: standalone)').matches || 
                  navigator.standalone) {
                document.querySelector('meta[name="viewport"]').setAttribute(
                  'content',
                  'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
                );
              }
            `,
          }}
        />
           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="apple-touch-icon" href="/Hestia-logo-b.svg"/>
        </Head>
        <body>
        <ClientLayout>
            <SpeedInsights/>
            {children}
      
            <CookiesPermission />
            <FeedbackWidget />
            {/*<GoogleTranslateProvider />*/}
            {/* <FeedbackWidget /> */}
        </ClientLayout>
        <InstallPrompt />
        </body>
        </html>
    );
}
