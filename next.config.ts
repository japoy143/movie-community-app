import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP without nonces (Next docs, "Without Nonces"): nonces force every page
// to render dynamically, which would drop the prerendered TMDB shell.
// 'unsafe-inline' scripts are needed for Next's inline bootstrap; the policy
// still limits scripts, images, fonts and connections to this origin (plus
// TMDB images), and blocks framing, plugins, <base> hijacking and
// cross-site form posts. Dev needs 'unsafe-eval' for React's debugging.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://image.tmdb.org",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Over http://localhost this would break dev; production is https.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Security headers for every route.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Ignored by browsers over plain http (localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
