import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/[^/]+$/,
  /^\/[^/]+\/login$/,
  /^\/ops$/,
  /^\/api\/public\//,
  /^\/api\/auth\//,
  /^\/_next\//,
  /^\/favicon\.ico$/,
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((pattern) => pattern.test(pathname))
}

const ADMIN_ONLY = ["/dashboard/clients"]
const ADMIN_OR_BILLING = ["/dashboard/billing"]
const ADMIN_OR_SUPPORT = ["/dashboard/support"]

function superadminAllowed(role: SuperadminRole, pathname: string): boolean {
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) return role === "ADMIN"
  if (ADMIN_OR_BILLING.some((p) => pathname.startsWith(p))) return role === "ADMIN" || role === "BILLING"
  if (ADMIN_OR_SUPPORT.some((p) => pathname.startsWith(p))) return role === "ADMIN" || role === "SUPPORT"
  return true
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (req.method === "OPTIONS") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    if (req.headers.get("origin") !== appUrl) {
      return new NextResponse(null, { status: 403 })
    }
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": appUrl,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  if (isPublicPath(pathname)) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (pathname.startsWith("/dashboard")) {
    if (!token || token.type !== "superadmin") {
      return NextResponse.redirect(new URL("/ops", req.url))
    }
    if (!superadminAllowed(token.role as SuperadminRole, pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.next()
  }

  if (pathname.match(/^\/[^/]+\/dashboard/)) {
    const slug = pathname.split("/")[1]!
    if (!token || token.type !== "vendor") {
      return NextResponse.redirect(new URL(`/${slug}/login`, req.url))
    }
    if (token.tenantSlug !== slug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/superadmin")) {
    if (!token || token.type !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/vendor")) {
    if (!token || token.type !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
