import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { forbiddenResponse, unauthorizedResponse } from "@/lib/validate"
import { getAppHost, normalizeDomainInput, verifyCustomDomain } from "@/lib/domains"

export const runtime = "nodejs"

const VerifyDomainSchema = z.object({
  customDomain: z.string().max(255).trim().optional(),
})

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") return unauthorizedResponse()
  if (session.user.role !== "ADMIN") return forbiddenResponse("Solo administradores pueden verificar dominios")

  const payload = VerifyDomainSchema.safeParse(await req.json().catch(() => ({})))
  if (!payload.success) {
    return NextResponse.json({ error: "Dominio inválido" }, { status: 400 })
  }

  await connectDB()

  const tenant = await Tenant.findById(id).lean()
  if (!tenant) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  const rawDomain = payload.data.customDomain ?? tenant.customDomain
  if (!rawDomain) {
    return NextResponse.json({ error: "Primero indica un dominio a verificar" }, { status: 400 })
  }

  let normalizedDomain: string
  try {
    normalizedDomain = normalizeDomainInput(rawDomain)
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

  const verification = await verifyCustomDomain(normalizedDomain)

  const updatedTenant = await Tenant.findByIdAndUpdate(
    id,
    {
      $set: {
        customDomain: verification.normalizedDomain,
        customDomainStatus: verification.status,
        customDomainVerifiedAt: verification.verified ? new Date() : null,
      },
    },
    { returnDocument: "after" }
  ).lean()

  return NextResponse.json({ verification, tenant: updatedTenant })
}