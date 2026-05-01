import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { getOrCreateStore } from "@/lib/db/tenant"
import { notFound } from "next/navigation"
import { KioskView } from "./KioskView"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function KioskPage({ params }: Props) {
  const { tenantSlug } = await params
  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean()
  if (!tenant) notFound()

  const store = JSON.parse(JSON.stringify(await getOrCreateStore(tenantSlug, tenant.name)))

  return (
    <KioskView
      tenantSlug={tenantSlug}
      storeName={store.name}
      logoUrl={store.logoUrl ?? null}
      primaryColor={store.theme?.primaryColor ?? "#22c55e"}
    />
  )
}
