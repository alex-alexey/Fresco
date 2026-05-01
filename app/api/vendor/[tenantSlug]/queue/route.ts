import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { unauthorizedResponse } from "@/lib/validate"

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  await connectDB()
  const { Queue } = await getTenantModels(tenantSlug)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [active, servedToday, onlineToday, presencialToday] = await Promise.all([
    Queue.find({ status: { $in: ["waiting", "called"] } }).sort({ position: 1 }).lean(),
    Queue.countDocuments({ status: "served", createdAt: { $gte: today } }),
    Queue.countDocuments({ type: "online", createdAt: { $gte: today } }),
    Queue.countDocuments({ type: "presencial", createdAt: { $gte: today } }),
  ])

  const called = active.find((e) => e.status === "called") ?? null
  const waiting = active.filter((e) => e.status === "waiting")

  return NextResponse.json({ called, waiting, servedToday, onlineToday, presencialToday })
}
