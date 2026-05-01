import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { unauthorizedResponse } from "@/lib/validate"

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function POST(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  await connectDB()
  const { Queue } = await getTenantModels(tenantSlug)

  // Mark current called entry as served
  await Queue.updateMany({ status: "called" }, { $set: { status: "served", callRoom: null } })

  // Call next waiting
  const next = await Queue.findOneAndUpdate(
    { status: "waiting" },
    { $set: { status: "called" } },
    { sort: { position: 1 }, returnDocument: "after" }
  ).lean()

  if (!next) {
    return NextResponse.json({ called: null, message: "No hay más turnos en espera" })
  }

  // For online customers: assign a WebRTC room ID
  if (next.type === "online") {
    const callRoom = `call-${tenantSlug}-${next._id}`
    await Queue.findByIdAndUpdate(next._id, { $set: { callRoom } })
    return NextResponse.json({ called: { ...next, callRoom }, callRoom })
  }

  return NextResponse.json({ called: next, callRoom: null })
}
