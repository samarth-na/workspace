import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && process.env.VERCEL === "1") {
  const required = [
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_REALTIME_URL",
    "NEXT_PUBLIC_WS_URL",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Vercel environment variables: ${missing.join(", ")}`,
    );
  }
  const authUrl = process.env.BETTER_AUTH_URL ?? "";
  const isLocalhost =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/.test(authUrl);
  if (!authUrl.startsWith("https://") && !isLocalhost) {
    throw new Error("BETTER_AUTH_URL must use HTTPS on Vercel.");
  }
}

const connectSources = [
  "'self'",
  process.env.NEXT_PUBLIC_REALTIME_URL,
  process.env.NEXT_PUBLIC_WS_URL,
  process.env.NEXT_PUBLIC_POSTHOG_HOST,
  "https://*.posthog.com",
  "https://*.posthog.io",
  "https://*.uploadthing.com",
  "https://*.utfs.io",
]
  .filter(Boolean)
  .join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://utfs.io https://*.utfs.io",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  `connect-src ${connectSources}`,
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.utfs.io",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), geolocation=(), payment=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
