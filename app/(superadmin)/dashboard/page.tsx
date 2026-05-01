import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { Plan } from "@/lib/db/models/Plan"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, AlertCircle, TrendingUp, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { IPlan } from "@/lib/db/models/Plan"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

const ROLE_LABELS: Record<SuperadminRole, string> = {
  ADMIN: "Administrador",
  BILLING: "Facturación",
  SUPPORT: "Soporte",
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

async function getDashboardData() {
  await connectDB()

  const [allTenants, plans] = await Promise.all([
    Tenant.find()
      .sort({ createdAt: -1 })
      .populate<{ planId: IPlan }>("planId", "name priceCents")
      .lean(),
    Plan.find({ isActive: true }).select("_id name priceCents").lean(),
  ])

  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const active = allTenants.filter((t) => t.status === "active")
  const suspended = allTenants.filter((t) => t.status === "suspended").length
  const mrr = active.reduce((sum, t) => sum + ((t.planId as unknown as IPlan)?.priceCents ?? 0), 0)

  const expiring = active
    .filter((t) => t.planExpiresAt && new Date(t.planExpiresAt) <= in14Days)
    .sort((a, b) => new Date(a.planExpiresAt).getTime() - new Date(b.planExpiresAt).getTime())

  const planDistribution = plans.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    priceCents: p.priceCents,
    count: allTenants.filter(
      (t) => (t.planId as unknown as IPlan)?._id?.toString() === p._id.toString()
    ).length,
  }))

  return {
    total: allTenants.length,
    active: active.length,
    suspended,
    mrr,
    recent: allTenants.slice(0, 5).map((t) => ({
      id: t._id.toString(),
      name: t.name,
      email: t.email,
      status: t.status,
      planName: (t.planId as unknown as IPlan)?.name ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    expiring: expiring.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      daysLeft: Math.ceil(
        (new Date(t.planExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
    planDistribution,
    totalTenants: allTenants.length,
  }
}

function DaysLeftLabel({ days }: { days: number }) {
  if (days <= 0) return <span className="text-xs font-medium text-destructive">Vencido</span>
  if (days === 1) return <span className="text-xs font-medium text-destructive">Mañana</span>
  if (days <= 3) return <span className="text-xs font-medium text-destructive">en {days} días</span>
  if (days <= 7) return <span className="text-xs font-medium text-amber-600">en {days} días</span>
  return <span className="text-xs font-medium text-muted-foreground">en {days} días</span>
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()

  const statCards = [
    { label: "Total clientes", value: data.total, icon: Building2, color: "text-foreground" },
    { label: "Activos", value: data.active, icon: CheckCircle2, color: "text-green-600" },
    { label: "Suspendidos", value: data.suspended, icon: AlertCircle, color: "text-destructive" },
    {
      label: "MRR estimado",
      value: `${(data.mrr / 100).toFixed(0)}€`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{session?.user.email}</p>
        </div>
        <Badge variant="outline" className="text-xs mt-1">
          {ROLE_LABELS[session!.user.role]}
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={cn("w-4 h-4", color)} />
            </CardHeader>
            <CardContent>
              <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Últimos clientes + próximos a vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <CardTitle className="text-sm font-semibold">Últimos clientes</CardTitle>
            <Link
              href="/dashboard/clients"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">Sin clientes todavía.</p>
            ) : (
              <ul className="divide-y">
                {data.recent.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/clients/${t.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {t.planName ?? "—"}
                        </span>
                        <Badge
                          variant={STATUS_BADGE[t.status] ?? "secondary"}
                          className="text-[11px]"
                        >
                          {STATUS_LABELS[t.status] ?? t.status}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3 space-y-0">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <CardTitle className="text-sm font-semibold">Vencen pronto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-6">
                Ningún plan vence en los próximos 14 días.
              </p>
            ) : (
              <ul className="divide-y">
                {data.expiring.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/clients/${t.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <DaysLeftLabel days={t.daysLeft} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución por plan */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">Distribución por plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.planDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin planes configurados.</p>
          ) : (
            data.planDistribution.map((p) => {
              const pct =
                data.totalTenants > 0
                  ? Math.round((p.count / data.totalTenants) * 100)
                  : 0
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {(p.priceCents / 100).toFixed(0)}€/mes
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{pct}%</span>
                      <span className="font-semibold tabular-nums">{p.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
