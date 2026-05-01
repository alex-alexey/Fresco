import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { parseBody, unauthorizedResponse } from "@/lib/validate"

const DaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
})

const SettingsSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  logoUrl: z.string().url().nullable().optional(),
  theme: z.object({ primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).optional(),
  social: z.object({
    instagram: z.string().max(100).nullable().optional(),
    facebook: z.string().max(100).nullable().optional(),
    tiktok: z.string().max(100).nullable().optional(),
  }).optional(),
  contact: z.object({
    phone: z.string().max(20).nullable().optional(),
    email: z.string().email().nullable().optional(),
    address: z.string().max(200).nullable().optional(),
  }).optional(),
  schedule: z.object({
    mon: DaySchema, tue: DaySchema, wed: DaySchema,
    thu: DaySchema, fri: DaySchema, sat: DaySchema,
  }).optional(),
})

interface RouteParams { params: Promise<{ tenantSlug: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)
  const store = await Store.findOne().lean()
  return NextResponse.json({ store })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    return unauthorizedResponse()
  }

  const body = parseBody(SettingsSchema, await req.json())
  if (!body.success) return body.response

  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)

  const store = await Store.findOneAndUpdate(
    {},
    { $set: body.data },
    { returnDocument: "after", upsert: true }
  ).lean()

  revalidatePath(`/${tenantSlug}`)

  return NextResponse.json({ store })
}
