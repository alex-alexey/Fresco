import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getOrCreateStore } from "@/lib/db/tenant"
import { SettingsForm } from "./SettingsForm"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { tenantSlug } = await params
  await connectDB()

  const rawStore = await getOrCreateStore(tenantSlug, tenantSlug)
  const store = JSON.parse(JSON.stringify(rawStore))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personaliza tu tienda pública
        </p>
      </div>
      <SettingsForm key={store.updatedAt ?? "init"} tenantSlug={tenantSlug} store={store} />
    </div>
  )
}
