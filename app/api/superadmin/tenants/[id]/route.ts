import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { getAppHost, normalizeDomainInput } from "@/lib/domains"
import { parseBody, forbiddenResponse, unauthorizedResponse } from "@/lib/validate"

const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().optional(),
  customDomain: z.string().max(255).trim().nullable().optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
  planId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  planExpiresAt: z.string().datetime().optional(),
  billing: z.object({
    name: z.string().min(2).max(200).trim(),
    taxId: z.string().min(5).max(20).trim(),
    address: z.string().min(5).max(300).trim(),
    postalCode: z.string().min(3).max(10).trim(),
    city: z.string().min(2).max(100).trim(),
    country: z.string().min(2).max(100).trim(),
  }).optional(),
})

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") return unauthorizedResponse()

  await connectDB()

  const tenant = await Tenant.findById(id).populate("planId", "name priceCents maxCameras").lean()
  if (!tenant) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  const plans = await Plan.find({ isActive: true }).select("_id name priceCents maxCameras").lean()

  return NextResponse.json({ tenant, plans })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") return unauthorizedResponse()
  if (session.user.role !== "ADMIN") return forbiddenResponse("Solo administradores pueden modificar clientes")

  const body = parseBody(UpdateTenantSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()

  const existingTenant = await Tenant.findById(id).lean()
  if (!existingTenant) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  const update: Record<string, unknown> = {}
  const { name, email, customDomain, status, planId, planExpiresAt, billing } = body.data

  if (name) update.name = name
  if (email) update.email = email
  if (status) update.status = status
  if (planExpiresAt) update.planExpiresAt = new Date(planExpiresAt)
  if (billing) update.billing = billing

  if (customDomain !== undefined) {
    if (!customDomain) {
      update.customDomain = null
      update.customDomainStatus = "none"
      update.customDomainVerifiedAt = null
    } else {
      let normalizedDomain: string
      try {
        normalizedDomain = normalizeDomainInput(customDomain)
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Dominio inválido" }, { status: 400 })
      }

      if (normalizedDomain === getAppHost()) {
        return NextResponse.json({ error: "Ese dominio ya pertenece a la plataforma" }, { status: 400 })
      }

      const existingTenant = await Tenant.findOne({ _id: { $ne: id }, customDomain: normalizedDomain }).lean()
      if (existingTenant) {
        return NextResponse.json({ error: "Ese dominio ya está asignado a otro cliente" }, { status: 409 })
      }

      update.customDomain = normalizedDomain
      if (existingTenant!.customDomain !== normalizedDomain) {
        update.customDomainStatus = "pending"
        update.customDomainVerifiedAt = null
      }
    }
  }

  if (planId) {
    const plan = await Plan.findById(planId).lean()
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    update.planId = planId
    update.planStartedAt = new Date()
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 1)
    update.planExpiresAt = expiry
  }

  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { $set: update },
    { returnDocument: "after" }
  ).populate("planId", "name priceCents maxCameras").lean()

  if (!tenant) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  return NextResponse.json({ tenant })
}
