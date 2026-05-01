import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { StreamPanel } from "./StreamPanel"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function StreamPage({ params }: Props) {
  const { tenantSlug } = await params

  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean()
  const plan = tenant ? await Plan.findById(tenant.planId).lean() : null
  const maxCameras = plan?.maxCameras ?? 1

  const { Store } = await getTenantModels(tenantSlug)
  const store = await Store.findOne().lean()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transmisión</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona tus cámaras e inicia la transmisión en directo
        </p>
      </div>

      <StreamPanel
        tenantSlug={tenantSlug}
        maxCameras={maxCameras}
        initialIsLive={store?.isLive ?? false}
      />
    </div>
  )
}
