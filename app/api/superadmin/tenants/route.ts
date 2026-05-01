import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { setupTenant } from "@/lib/db/tenant"
import { sanitizeSlug, tenantDbName } from "@/lib/slug"
import { parseBody, forbiddenResponse, unauthorizedResponse, rateLimitResponse } from "@/lib/validate"
import { apiRateLimit, getIp } from "@/lib/rate-limit"
import { sendTenantWelcomeEmail } from "@/lib/email/mailer"
import { env } from "@/lib/env"

const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  planId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid plan ID"),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  billing: z.object({
    name: z.string().min(2).max(200).trim(),
    taxId: z.string().min(5).max(20).trim(),
    address: z.string().min(5).max(300).trim(),
    postalCode: z.string().min(3).max(10).trim(),
    city: z.string().min(2).max(100).trim(),
    country: z.string().min(2).max(100).trim(),
  }),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") return unauthorizedResponse()

  const { success, reset } = await apiRateLimit.limit(getIp(req))
  if (!success) return rateLimitResponse(reset)

  await connectDB()

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = 20
  const skip = (page - 1) * limit

  const [tenants, total] = await Promise.all([
    Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("planId", "name priceCents").lean(),
    Tenant.countDocuments(),
  ])

  return NextResponse.json({ tenants, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") return unauthorizedResponse()
  if (session.user.role !== "ADMIN") return forbiddenResponse("Solo administradores pueden crear clientes")

  const { success, reset } = await apiRateLimit.limit(getIp(req))
  if (!success) return rateLimitResponse(reset)

  const body = parseBody(CreateTenantSchema, await req.json())
  if (!body.success) return body.response

  const { name, email, planId, slug: rawSlug, billing } = body.data

  let slug: string
  try {
    slug = sanitizeSlug(rawSlug)
  } catch {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 })
  }

  await connectDB()

  const [plan, existing] = await Promise.all([
    Plan.findById(planId).lean(),
    Tenant.exists({ slug }),
  ])

  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
  if (existing) return NextResponse.json({ error: "El slug ya está en uso" }, { status: 409 })

  const dbName = tenantDbName(slug)

  const planStartedAt = new Date()
  const planExpiresAt = new Date(planStartedAt)
  planExpiresAt.setMonth(planExpiresAt.getMonth() + 1)

  const tenant = await Tenant.create({ name, email, planId, slug, dbName, status: "active", planStartedAt, planExpiresAt, billing })

  try {
    const tempPassword = await setupTenant(slug, email, name)
    const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    const loginUrl = `${appUrl}/${slug}/login`
    const welcomeEmail = await sendTenantWelcomeEmail({
      to: email,
      tenantName: name,
      tenantSlug: slug,
      password: tempPassword,
      loginUrl,
    })

    if (!welcomeEmail.sent) {
      console.warn("Welcome email not sent:", {
        tenantId: tenant._id.toString(),
        email,
        error: welcomeEmail.error,
      })
    }

    return NextResponse.json(
      {
        tenant,
        tempPassword,
        welcomeEmailSent: welcomeEmail.sent,
      },
      { status: 201 }
    )
  } catch (err) {
    await Tenant.deleteOne({ _id: tenant._id })
    console.error("Tenant provisioning failed:", err)
    return NextResponse.json({ error: "Error al provisionar la base de datos del cliente" }, { status: 500 })
  }
}
