import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { getOrCreateStore } from "@/lib/db/tenant"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function VendorDashboardPage({ params }: Props) {
  const { tenantSlug } = await params
  const session = await auth()

  await connectDB()
  const { Stream } = await getTenantModels(tenantSlug)
  const store = await getOrCreateStore(tenantSlug, tenantSlug)

  const totalStreams = await Stream.countDocuments()
  const lastStream = await Stream.findOne().sort({ startedAt: -1 }).lean()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Bienvenido, {session?.user.email}</p>
        </div>
        <Badge variant={store.isLive ? "destructive" : "secondary"} className="text-sm px-3 py-1">
          {store.isLive ? "🔴 EN DIRECTO" : "OFFLINE"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transmisiones totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalStreams}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última transmisión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {lastStream
                ? new Date(lastStream.startedAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Sin transmisiones aún"}
            </p>
          </CardContent>
        </Card>
      </div>

      {!store.isLive && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">Tu tienda está offline. Inicia una transmisión para que tus clientes puedan verte.</p>
          <a
            href={`/${tenantSlug}/dashboard/stream`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Ir a Transmisión
          </a>
        </div>
      )}
    </div>
  )
}
