import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { CreateTenantDialog } from "./CreateTenantDialog"
import { ClientsTable } from "./ClientsTable"
import type { IPlan } from "@/lib/db/models/Plan"

function formatDate(date: Date): string {
  const d = date.getUTCDate().toString().padStart(2, "0")
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const y = date.getUTCFullYear()
  return `${d}/${m}/${y}`
}

async function getData() {
  await connectDB()
  const [tenants, plans] = await Promise.all([
    Tenant.find().sort({ createdAt: -1 }).populate<{ planId: IPlan }>("planId", "name").lean(),
    Plan.find({ isActive: true }).select("_id name priceCents maxCameras").lean(),
  ])
  return { tenants, plans }
}

export default async function ClientsPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  const { tenants, plans } = await getData()

  const serializedPlans = plans.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    priceCents: p.priceCents,
    maxCameras: p.maxCameras,
  }))

  const rows = tenants.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    email: t.email,
    slug: t.slug,
    planName: (t.planId as unknown as IPlan)?.name ?? null,
    status: t.status,
    createdAt: formatDate(t.createdAt),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tenants.length} cliente{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateTenantDialog plans={serializedPlans} />
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Sin clientes todavía</p>
          <p className="text-sm mt-1">Crea el primer cliente con el botón de arriba</p>
        </div>
      ) : (
        <ClientsTable tenants={rows} />
      )}
    </div>
  )
}
