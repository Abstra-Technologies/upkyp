import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";
import "leaflet/dist/leaflet.css";
import InstallPrompt from "@/components/Commons/installPrompt";
import Head from "next/head";
import CookiesPermission from "@/components/Commons/setttings/cookiesPermission";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

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
    description: "Manage Less. Connect More. Your Rental Management Partner",
    manifest: "/manifest.json",
    icons: {
        icon: [
            {
                url: "/upkyp_violet.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/upkyp_white.png",
                media: "(prefers-color-scheme: dark)",
            },
        ],
        apple: [
            {
                url: "/upkyp_violet.png",
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
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Head>
            <link rel="manifest" href="/manifest.json"/>
            <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            <link rel="preconnect" href="https://res.cloudinary.com" />
            <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"/>
            <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)"/>
            <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.body.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="apple-touch-icon" href="/Hestia-logo-b.svg"/>
        </Head>
        <body className="bg-white dark:bg-black text-gray-900 dark:text-gray-100 antialiased transition-colors duration-300">
        <ClientLayout>
            <SpeedInsights/>
            <Analytics/>
            {children}
            <CookiesPermission />
        </ClientLayout>
        <InstallPrompt />
        </body>
        </html>
    );
}
