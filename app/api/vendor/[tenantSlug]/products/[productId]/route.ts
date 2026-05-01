import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { unauthorizedResponse } from "@/lib/validate"
import mongoose from "mongoose"

interface RouteParams { params: Promise<{ tenantSlug: string; productId: string }> }

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { tenantSlug, productId } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)

  await Store.updateOne({}, { $pull: { products: { _id: new mongoose.Types.ObjectId(productId) } } })
  return NextResponse.json({ ok: true })
}
