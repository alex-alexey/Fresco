import { NextResponse } from "next/server"
import { z } from "zod"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody } from "@/lib/validate"
import { apiRateLimit, getIp } from "@/lib/rate-limit"

const SignalSchema = z.object({
  type: z.enum(["answer", "ice-candidate"]),
  payload: z.string(),
})

interface RouteParams { params: Promise<{ tenantSlug: string; viewerId: string }> }

// Viewer polls for vendor's signals (offer + ICE)
export async function GET(req: Request, { params }: RouteParams) {
  const { tenantSlug, viewerId } = await params
  const since = new URL(req.url).searchParams.get("since")

  await connectDB()
  const { StreamSignal } = await getTenantModels(tenantSlug)

  const query: Record<string, unknown> = { viewerId, from: "vendor" }
  if (since) query.createdAt = { $gt: new Date(since) }

  const signals = await StreamSignal.find(query).sort({ createdAt: 1 }).lean()
  return NextResponse.json(signals)
}

// Viewer sends answer / ICE candidates to vendor
export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug, viewerId } = await params

  const { success, reset } = await apiRateLimit.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    })
  }

  const body = parseBody(SignalSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { StreamSignal } = await getTenantModels(tenantSlug)
  await StreamSignal.create({ viewerId, from: "viewer", ...body.data })

  return NextResponse.json({ ok: true })
}
