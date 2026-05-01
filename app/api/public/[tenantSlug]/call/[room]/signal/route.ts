import { NextResponse } from "next/server"
import { z } from "zod"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody } from "@/lib/validate"
import { apiRateLimit, getIp } from "@/lib/rate-limit"

const SignalSchema = z.object({
  type: z.enum(["offer", "answer", "ice-candidate"]),
  payload: z.string(),
})

interface RouteParams { params: Promise<{ tenantSlug: string; room: string }> }

export async function GET(req: Request, { params }: RouteParams) {
  const { tenantSlug, room } = await params
  const since = new URL(req.url).searchParams.get("since")

  await connectDB()
  const { WebRTCSignal } = await getTenantModels(tenantSlug)

  const query: Record<string, unknown> = { callRoom: room, from: "vendor" }
  if (since) query.createdAt = { $gt: new Date(since) }

  const signals = await WebRTCSignal.find(query).sort({ createdAt: 1 }).lean()
  return NextResponse.json(signals)
}

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug, room } = await params

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
  const { WebRTCSignal } = await getTenantModels(tenantSlug)
  await WebRTCSignal.create({ callRoom: room, from: "customer", ...body.data })

  return NextResponse.json({ ok: true })
}
