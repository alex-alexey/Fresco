import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody, unauthorizedResponse } from "@/lib/validate"

const SignalSchema = z.object({
  type: z.enum(["offer", "ice-candidate"]),
  payload: z.string(),
})

interface RouteParams { params: Promise<{ tenantSlug: string; viewerId: string }> }

async function authorize(tenantSlug: string) {
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) return false
  return true
}

// Vendor polls for a specific viewer's signals (answer + ICE)
export async function GET(req: Request, { params }: RouteParams) {
  const { tenantSlug, viewerId } = await params
  if (!await authorize(tenantSlug)) return unauthorizedResponse()

  const since = new URL(req.url).searchParams.get("since")

  await connectDB()
  const { StreamSignal } = await getTenantModels(tenantSlug)

  const query: Record<string, unknown> = { viewerId, from: "viewer", type: { $ne: "join" } }
  if (since) query.createdAt = { $gt: new Date(since) }

  const signals = await StreamSignal.find(query).sort({ createdAt: 1 }).lean()
  return NextResponse.json(signals)
}

// Vendor sends offer / ICE to a specific viewer
export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug, viewerId } = await params
  if (!await authorize(tenantSlug)) return unauthorizedResponse()

  const body = parseBody(SignalSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { StreamSignal } = await getTenantModels(tenantSlug)
  await StreamSignal.create({ viewerId, from: "vendor", ...body.data })

  return NextResponse.json({ ok: true })
}
