import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"

interface RouteParams { params: Promise<{ tenantSlug: string; id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug, id } = await params

  await connectDB()
  const { Queue } = await getTenantModels(tenantSlug)

  const entry = await Queue.findById(id).lean()
  if (!entry) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })

  const result: Record<string, unknown> = {
    status: entry.status,
    position: entry.position,
  }

  if (entry.status === "called" && entry.callRoom) {
    result.callRoom = entry.callRoom
  }

  return NextResponse.json(result)
}
