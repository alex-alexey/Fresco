import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { unauthorizedResponse } from "@/lib/validate"

interface RouteParams { params: Promise<{ tenantSlug: string; phone: string }> }

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { tenantSlug, phone } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const decoded = decodeURIComponent(phone)

  await connectDB()
  const { BlockedPhone } = await getTenantModels(tenantSlug)
  await BlockedPhone.deleteOne({ phone: decoded })

  return NextResponse.json({ ok: true })
}
