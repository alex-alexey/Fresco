import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody, unauthorizedResponse } from "@/lib/validate"

const BlockSchema = z.object({
  phone: z.string().min(6).max(20).trim(),
  reason: z.string().max(200).trim().optional(),
})

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  await connectDB()
  const { BlockedPhone } = await getTenantModels(tenantSlug)
  const blocked = await BlockedPhone.find().sort({ blockedAt: -1 }).lean()

  return NextResponse.json(blocked)
}

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const body = parseBody(BlockSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { BlockedPhone } = await getTenantModels(tenantSlug)

  try {
    const entry = await BlockedPhone.findOneAndUpdate(
      { phone: body.data.phone },
      { $set: { phone: body.data.phone, reason: body.data.reason ?? null } },
      { upsert: true, new: true }
    ).lean()
    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al bloquear el número" }, { status: 500 })
  }
}
