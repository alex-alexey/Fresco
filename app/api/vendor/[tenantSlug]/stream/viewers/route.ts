import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { unauthorizedResponse } from "@/lib/validate"

interface RouteParams { params: Promise<{ tenantSlug: string }> }

// Vendor polls for new viewers that joined since a given timestamp
export async function GET(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const since = new URL(req.url).searchParams.get("since")

  await connectDB()
  const { StreamSignal } = await getTenantModels(tenantSlug)

  const query: Record<string, unknown> = { from: "viewer", type: "join" }
  if (since) query.createdAt = { $gt: new Date(since) }

  const joins = await StreamSignal.find(query).sort({ createdAt: 1 }).lean()
  return NextResponse.json(joins.map((j) => ({ viewerId: j.viewerId, createdAt: j.createdAt })))
}
