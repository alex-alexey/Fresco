import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { parseBody, unauthorizedResponse, forbiddenResponse } from "@/lib/validate"

const StartStreamSchema = z.object({
  cameraCount: z.number().int().min(1).max(4),
})

interface RouteParams {
  params: Promise<{ tenantSlug: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params

  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const body = parseBody(StartStreamSchema, await req.json())
  if (!body.success) return body.response

  const { cameraCount } = body.data

  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug }).populate("planId").lean()
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })

  const plan = await Plan.findById(tenant.planId).lean()
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

  if (cameraCount > plan.maxCameras) {
    return forbiddenResponse(`Tu plan permite un máximo de ${plan.maxCameras} cámara${plan.maxCameras !== 1 ? "s" : ""}`)
  }

  const { Store, Stream } = await getTenantModels(tenantSlug)

  let store = await Store.findOne()
  if (!store) store = await Store.create({ name: tenantSlug, isLive: false, activeCameras: [] })

  if (store.isLive) {
    return NextResponse.json({ error: "Ya hay una transmisión activa" }, { status: 409 })
  }

  const streamId = `stream-${tenantSlug}-${Date.now()}`
  await Stream.create({ streamId, cameraCount, startedAt: new Date() })

  store.isLive = true
  store.activeCameras = Array.from({ length: cameraCount }, (_, i) => i)
  await store.save()

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params

  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const { Store, Stream } = await getTenantModels(tenantSlug)

  const store = await Store.findOne()
  if (!store?.isLive) {
    return NextResponse.json({ error: "No hay transmisión activa" }, { status: 409 })
  }

  const activeStream = await Stream.findOne({ endedAt: null }).sort({ startedAt: -1 })
  if (activeStream) {
    activeStream.endedAt = new Date()
    await activeStream.save()
  }

  store.isLive = false
  store.activeCameras = []
  await store.save()

  return NextResponse.json({ ok: true })
}
