import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody, unauthorizedResponse } from "@/lib/validate"

const ProductSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(300).trim().default(""),
  imageUrl: z.string().url().nullable().default(null),
})

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function POST(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const body = parseBody(ProductSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)

  const store = await Store.findOneAndUpdate(
    {},
    { $push: { products: body.data } },
    { returnDocument: "after", upsert: true }
  ).lean()

  const product = store?.products?.at(-1)
  return NextResponse.json({ product }, { status: 201 })
}
