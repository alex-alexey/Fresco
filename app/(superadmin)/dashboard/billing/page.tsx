import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TrendingUp, Users, Package, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IPlan } from "@/lib/db/models/Plan"
import { HardwareCalculator, type HardwareComponent } from "./HardwareCalculator"

const HARDWARE_COMPONENTS: HardwareComponent[] = [
  { name: "Cámara streaming",     model: "Logitech C920s HD Pro",           unitCents:  7500, perCamera: true,  defaultQty: 1, url: "https://www.amazon.es/Logitech-Video-Llamadas-Correcci%C3%B3n-Iluminaci%C3%B3n-Autom%C3%A1tica/dp/B07MM4V7NR" },
  { name: "Soporte cámara",       model: "Elgato Wall Mount articulado",     unitCents:  2800, perCamera: true,  defaultQty: 1, url: "https://www.amazon.es/Elgato-Wall-Mount-articulado-accesorio/dp/B097386X7P" },
  { name: "Auricular vendedor",   model: "Jabra Evolve 20 Monoaural USB",    unitCents:  5700, perCamera: false, defaultQty: 1, url: "https://www.amazon.es/Jabra-Evolve-Mono-Headset-certificados/dp/B0DX7CBWMZ" },
  { name: "Tablet vendedor",      model: "Samsung Galaxy Tab A9+ 128GB",     unitCents: 21000, perCamera: false, defaultQty: 1, url: "https://www.amazon.es/Samsung-Android-Almacenamiento-Pantalla-Espa%C3%B1ola/dp/B0CMDKCSFS" },
  { name: "Tablet kiosk cliente", model: "Android 10\" (Teclast/Blackview)", unitCents:  9000, perCamera: false, defaultQty: 1 },
  { name: "Soporte tablet kiosk", model: "Soporte mesa con cerradura",       unitCents:  2000, perCamera: false, defaultQty: 1 },
  { name: "Impresora térmica",    model: "POSIBERICA P80 Plus USB/LAN",      unitCents:  7500, perCamera: false, defaultQty: 1, url: "https://www.amazon.es/POSIBERICA-Impresora-Tickets-TERMICA-ETHERNET/dp/B00UX746RS" },
  { name: "Papel térmico",        model: "Pack 10 rollos 80mm",              unitCents:  1200, perCamera: false, defaultQty: 1 },
]

async function getData() {
  await connectDB()
  const [tenants, plans] = await Promise.all([
    Tenant.find().populate<{ planId: IPlan }>("planId", "name priceCents hardwareCostCents setupFeeCents").lean(),
    Plan.find({ isActive: true }).sort({ priceCents: 1 }).lean(),
  ])
  return { tenants, plans }
}

export default async function BillingPage() {
  const { tenants, plans } = await getData()

  const activeTenants = tenants.filter((t) => t.status === "active")
  const mrr = activeTenants.reduce(
    (sum, t) => sum + ((t.planId as unknown as IPlan)?.priceCents ?? 0),
    0
  )

  const byPlan = plans.map((p) => {
    const planTenants = tenants.filter(
      (t) => (t.planId as unknown as IPlan)?._id?.toString() === p._id.toString()
    )
    return {
      id: p._id.toString(),
      name: p.name,
      priceCents: p.priceCents,
      hardwareCostCents: p.hardwareCostCents ?? 0,
      setupFeeCents: p.setupFeeCents ?? 0,
      maxCameras: p.maxCameras,
      count: planTenants.length,
    }
  })

  const totalHardwareCost = byPlan.reduce((sum, p) => sum + p.hardwareCostCents * p.count, 0)
  const totalSetupRevenue = byPlan.reduce((sum, p) => sum + p.setupFeeCents * p.count, 0)
  const hardwareMargin = totalSetupRevenue - totalHardwareCost

  const statCards = [
    { label: "MRR estimado",     value: `${(mrr / 100).toFixed(0)}€`,              sub: "ingresos mensuales recurrentes",    icon: TrendingUp,  color: "text-blue-600" },
    { label: "Clientes activos", value: activeTenants.length,                       sub: `de ${tenants.length} totales`,      icon: Users,       color: "text-green-600" },
    { label: "Hardware invertido",value: `${(totalHardwareCost / 100).toFixed(0)}€`, sub: "coste total de kits enviados",    icon: Package,     color: "text-orange-600" },
    { label: "Margen en altas",  value: `${(hardwareMargin / 100).toFixed(0)}€`,   sub: `de ${(totalSetupRevenue / 100).toFixed(0)}€ facturados`, icon: ArrowUpRight, color: hardwareMargin >= 0 ? "text-green-600" : "text-destructive" },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">Ingresos, gastos y márgenes</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={cn("w-4 h-4", color)} />
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ingresos por plan */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Ingresos por plan</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Precio/mes</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead className="text-right">MRR parcial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPlan.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{(p.priceCents / 100).toFixed(0)}€/mes</TableCell>
                  <TableCell><Badge variant="secondary">{p.count}</Badge></TableCell>
                  <TableCell className="text-right font-medium">
                    {((p.priceCents * p.count) / 100).toFixed(0)}€
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={3}>Total MRR</TableCell>
                <TableCell className="text-right text-blue-600">{(mrr / 100).toFixed(0)}€</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Gastos de hardware por cliente */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Gastos de hardware por cliente</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Coste kit</TableHead>
                <TableHead>Alta cobrada</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead className="text-right">Total invertido</TableHead>
                <TableHead className="text-right">Total facturado</TableHead>
                <TableHead className="text-right">Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPlan.map((p) => {
                const invertido = p.hardwareCostCents * p.count
                const facturado = p.setupFeeCents * p.count
                const margen = facturado - invertido
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(p.hardwareCostCents / 100).toFixed(0)}€</TableCell>
                    <TableCell className="text-muted-foreground">{(p.setupFeeCents / 100).toFixed(0)}€</TableCell>
                    <TableCell><Badge variant="secondary">{p.count}</Badge></TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">{(invertido / 100).toFixed(0)}€</TableCell>
                    <TableCell className="text-right font-medium">{(facturado / 100).toFixed(0)}€</TableCell>
                    <TableCell className={cn("text-right font-medium", margen >= 0 ? "text-green-600" : "text-destructive")}>
                      {margen >= 0 ? "+" : ""}{(margen / 100).toFixed(0)}€
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={4}>Total hardware</TableCell>
                <TableCell className="text-right text-orange-600">{(totalHardwareCost / 100).toFixed(0)}€</TableCell>
                <TableCell className="text-right">{(totalSetupRevenue / 100).toFixed(0)}€</TableCell>
                <TableCell className={cn("text-right", hardwareMargin >= 0 ? "text-green-600" : "text-destructive")}>
                  {hardwareMargin >= 0 ? "+" : ""}{(hardwareMargin / 100).toFixed(0)}€
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Calculadora interactiva de hardware */}
      <HardwareCalculator
        components={HARDWARE_COMPONENTS}
        plans={byPlan.map((p) => ({
          id: p.id,
          name: p.name,
          maxCameras: p.maxCameras,
          setupFeeCents: p.setupFeeCents,
        }))}
      />
    </div>
  )
}
