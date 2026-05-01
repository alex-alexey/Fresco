import { NextResponse } from "next/server"
import { z } from "zod"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody } from "@/lib/validate"
import { apiRateLimit, getIp } from "@/lib/rate-limit"

const JoinQueueSchema = z.object({
  customerName: z.string().min(1).max(100).trim().optional(),
  customerPhone: z.string().min(6).max(20).trim().optional(),
  type: z.enum(["online", "presencial"]).default("online"),
})

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  await connectDB()
  const { Queue } = await getTenantModels(tenantSlug)
  const waiting = await Queue.countDocuments({ status: "waiting" })
  const called = await Queue.findOne({ status: "called" }).lean()
  return NextResponse.json({ waiting, currentNumber: called?.position ?? null })
}

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params

  const { success, reset } = await apiRateLimit.limit(getIp(req))
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    })
  }

  const body = parseBody(JoinQueueSchema, await req.json())
  if (!body.success) return body.response

  const { type, customerName, customerPhone } = body.data

  if (type === "online" && (!customerName || !customerPhone)) {
    return NextResponse.json({ error: "Nombre y teléfono requeridos para la cola online" }, { status: 400 })
  }

  await connectDB()
  const { Queue, BlockedPhone } = await getTenantModels(tenantSlug)

  if (customerPhone) {
    const blocked = await BlockedPhone.exists({ phone: customerPhone })
    if (blocked) {
      return NextResponse.json({ error: "Este número no puede unirse a la cola" }, { status: 403 })
    }
  }

  const lastInQueue = await Queue.findOne({ status: "waiting" }).sort({ position: -1 }).lean()
  const position = (lastInQueue?.position ?? 0) + 1

  const entry = await Queue.create({
    customerName: customerName ?? "—",
    customerPhone: customerPhone ?? null,
    position,
    type,
    status: "waiting",
  })

  return NextResponse.json({ id: entry._id.toString(), position: entry.position }, { status: 201 })
}
