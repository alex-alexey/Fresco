import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { apiRateLimit, getIp } from "@/lib/rate-limit"

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params

  const { success, reset } = await apiRateLimit.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    })
  }

  await connectDB()
  const { Store, StreamSignal } = await getTenantModels(tenantSlug)

  const store = await Store.findOne().select("isLive").lean()
  if (!store?.isLive) {
    return NextResponse.json({ error: "La tienda no está en directo" }, { status: 404 })
  }

  const viewerId = randomUUID()
  await StreamSignal.create({ viewerId, from: "viewer", type: "join", payload: "{}" })

  return NextResponse.json({ viewerId }, { status: 201 })
}
