import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { IPlan } from "@/lib/db/models/Plan"

async function getTenants() {
  await connectDB()
  return Tenant.find()
    .sort({ createdAt: -1 })
    .populate<{ planId: IPlan }>("planId", "name maxCameras")
    .lean()
}

const STATUS_BADGE: Record<string, "default" | "destructive" | "secondary"> = {
  active: "default",
  suspended: "destructive",
  pending: "secondary",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Pendiente",
}

export default async function SupportPage() {
  const tenants = await getTenants()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soporte</h1>
        <p className="text-sm text-muted-foreground mt-1">Información de contacto de clientes</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Sin clientes registrados
                </TableCell>
              </TableRow>
            )}
            {tenants.map((t) => (
              <TableRow key={t._id.toString()}>
                <TableCell>
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {(t.planId as unknown as IPlan)?.name ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[t.status] ?? "secondary"}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{t.slug}</code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
