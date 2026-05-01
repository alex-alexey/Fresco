import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)
  const store = await Store.findOne().select("isLive activeCameras").lean()
  return NextResponse.json({
    isLive: store?.isLive ?? false,
    cameraCount: store?.activeCameras?.length ?? 1,
  })
}
