import { getOrCreateStore } from "@/lib/db/tenant"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { resolveTenantFromHost } from "@/lib/domains"

export interface StorefrontStore {
  name: string
  description?: string
  logoUrl?: string | null
  isLive: boolean
  activeCameras?: unknown[]
  theme?: { primaryColor?: string }
  social?: { instagram?: string | null; facebook?: string | null; tiktok?: string | null }
  schedule?: Record<string, { open?: string; close?: string; closed?: boolean }>
  products?: Array<{ _id: string; name: string; description?: string; imageUrl?: string | null }>
  contact?: { phone?: string | null; email?: string | null; address?: string | null }
}

export interface PublicStorefrontData {
  tenantName: string
  tenantSlug: string
  store: StorefrontStore
  primaryColor: string
  hasContact: boolean
}

export async function getPublicStorefrontBySlug(tenantSlug: string): Promise<PublicStorefrontData | null> {
  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean()
  if (!tenant) return null

  const store = JSON.parse(JSON.stringify(await getOrCreateStore(tenantSlug, tenant.name))) as StorefrontStore
  const primaryColor = store.theme?.primaryColor ?? "#22c55e"
  const hasContact = Boolean(store.contact?.phone || store.contact?.email || store.contact?.address)

  return {
    tenantName: tenant.name,
    tenantSlug,
    store,
    primaryColor,
    hasContact,
  }
}

export async function getPublicStorefrontByHost(host: string): Promise<PublicStorefrontData | null> {
  await connectDB()
  const tenant = await resolveTenantFromHost(host)
  if (!tenant) return null

  return getPublicStorefrontBySlug(tenant.slug)
}