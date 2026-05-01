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
  const { Queue, BlockedPhone } = await getTenantModels(tenantSlug)

  const [customers, blocked] = await Promise.all([
    Queue.aggregate([
      { $match: { type: "online", customerPhone: { $ne: null } } },
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          visits: { $sum: 1 },
          lastSeen: { $max: "$createdAt" },
        },
      },
      { $sort: { lastSeen: -1 } },
      { $limit: 200 },
    ]),
    BlockedPhone.find().sort({ blockedAt: -1 }).lean(),
  ])

  return NextResponse.json({ customers, blocked })
}
