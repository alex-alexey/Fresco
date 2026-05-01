import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody, unauthorizedResponse } from "@/lib/validate"

const UpdateSchema = z.object({
  status: z.enum(["served", "cancelled"]),
})

interface RouteParams { params: Promise<{ tenantSlug: string; id: string }> }

export async function PATCH(req: Request, { params }: RouteParams) {
  const { tenantSlug, id } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const body = parseBody(UpdateSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { Queue } = await getTenantModels(tenantSlug)

  const entry = await Queue.findByIdAndUpdate(
    id,
    { $set: { status: body.data.status } },
    { returnDocument: "after" }
  ).lean()

  if (!entry) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })

  return NextResponse.json({ entry })
}
