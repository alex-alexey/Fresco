import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { Badge } from "@/components/ui/badge"
import { TenantEditForm } from "./TenantEditForm"
import type { IPlan } from "@/lib/db/models/Plan"

interface Props {
  params: Promise<{ id: string }>
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

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  await connectDB()

  const [tenant, plans] = await Promise.all([
    Tenant.findById(id).populate<{ planId: IPlan }>("planId", "name priceCents maxCameras").lean(),
    Plan.find({ isActive: true }).select("_id name priceCents maxCameras").lean(),
  ])

  if (!tenant) notFound()

  const serialized = JSON.parse(JSON.stringify(tenant))
  const serializedPlans = JSON.parse(JSON.stringify(plans))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/dashboard/clients" className="hover:text-foreground transition-colors">
            Clientes
          </Link>
          <span>/</span>
          <span className="text-foreground">{tenant.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tenant.email}</p>
          </div>
          <Badge variant={STATUS_BADGE[tenant.status] ?? "secondary"} className="mt-1">
            {STATUS_LABELS[tenant.status] ?? tenant.status}
          </Badge>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="text-sm font-medium font-mono">/{tenant.slug}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="text-sm font-medium">{(tenant.planId as unknown as IPlan)?.name ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Expira</p>
          <p className="text-sm font-medium">
            {tenant.planExpiresAt ? new Date(tenant.planExpiresAt).toLocaleDateString("es-ES") : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Alta</p>
          <p className="text-sm font-medium">{new Date(tenant.createdAt).toLocaleDateString("es-ES")}</p>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="flex gap-3">
        <a
          href={`/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
        >
          Ver tienda pública ↗
        </a>
        <a
          href={`/${tenant.slug}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
        >
          Panel del vendor ↗
        </a>
      </div>

      <hr className="border-border" />

      {/* Form */}
      <TenantEditForm
        key={serialized.updatedAt}
        tenant={serialized}
        plans={serializedPlans}
      />
    </div>
  )
}
