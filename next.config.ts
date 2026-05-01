import type { NextConfig } from "next"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  `connect-src 'self' wss://*.livekit.cloud https://*.livekit.cloud`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "false" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=()",
  },
]

// Vendor stream pages need camera + microphone access
const vendorStreamHeaders = [
  ...securityHeaders.filter((h) => h.key !== "Permissions-Policy"),
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
]

const corsHeaders = [
  { key: "Access-Control-Allow-Origin", value: appUrl },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
  { key: "Access-Control-Max-Age", value: "86400" },
]

const nextConfig: NextConfig = {
  eslint: {
    // ESLint 9 + next/core-web-vitals has a circular JSON serialization bug in Next.js 15.
    // Run lint separately with: npm run lint
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(.*)",
        headers: corsHeaders,
      },
      {
        // Vendor stream pages need camera access
        source: "/:tenantSlug/dashboard/stream",
        headers: vendorStreamHeaders,
      },
    ]
  },
  experimental: {
    serverActions: { allowedOrigins: [appUrl.replace(/^https?:\/\//, "")] },
  },
}

export default nextConfig
