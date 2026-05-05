import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const baseConfig: NextConfig = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  /**
   * 🔐 Remove X-Powered-By: Next.js header
   */
  poweredByHeader: false,

  /**
   * Silence turbopack auto-detection
   */
  turbopack: {},

  /**
   * 🔓 Allowed Dev Origins (for ngrok, etc.)
   */
  allowedDevOrigins: ['reposeful-prorealistic-ami.ngrok-free.dev', 'https://tbk5fv-ip-112-210-205-253.tunnelmole.net'],

  /**
   * 🔐 Security Headers (GLOBAL)
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",

              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://connect.facebook.net https://www.gstatic.com",

              "style-src 'self' 'unsafe-inline'",

              // ✅ Images (UNCHANGED)
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org https://res.cloudinary.com https://*.cloudinary.com https://lh3.googleusercontent.com https://upload.wikimedia.org https://encrypted-tbn0.gstatic.com https://mir-s3-cdn-cf.behance.net https://cdn-icons-png.flaticon.com https://rentalley-bucket.s3.ap-southeast-1.amazonaws.com https://rentahanbucket.s3.us-east-1.amazonaws.com https://www.google-analytics.com https://www.googletagmanager.com",

              // ✅ API / WS (UNCHANGED)
              "connect-src 'self' https://*.openstreetmap.org https://*.tile.openstreetmap.org https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.supabase.co wss://*.supabase.co https://upkyp-chatserver.onrender.com wss://upkyp-chatserver.onrender.com http://localhost:3000 ws://localhost:3000",
              "font-src 'self' data:",

              // ✅ UPDATED: allow PDF iframe
              "frame-src 'self' https://www.google.com https://www.youtube.com https://rentalley-bucket.s3.ap-southeast-1.amazonaws.com",

              // REQUIRED for <object> / <embed> PDFs
              "object-src 'self' https://rentalley-bucket.s3.ap-southeast-1.amazonaws.com",

              "media-src 'self' https://rentalley-bucket.s3.ap-southeast-1.amazonaws.com",

              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          }


        ],
      },

      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://upkyp.com",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
      {
        protocol: "https",
        hostname: "rentalley-bucket.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mir-s3-cdn-cf.behance.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rentahanbucket.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "photos.app.goo.gl" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

const withPWA = nextPwa({
  dest: "public",
  register: true,
  sw: "sw.js",
  disable: process.env.NODE_ENV === "development",

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
      handler: "NetworkOnly",
      options: {
        cacheName: "osm-tiles",
      },
    },
  ],
});


export default withPWA(baseConfig);