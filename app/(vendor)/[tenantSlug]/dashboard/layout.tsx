import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { getTenantModels } from "@/lib/db/tenant-models"
import { Badge } from "@/components/ui/badge"

interface Props {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

const NAV = [
  { href: "dashboard", label: "Inicio" },
  { href: "dashboard/stream", label: "Transmisión" },
  { href: "dashboard/queue", label: "Cola de turnos" },
  { href: "dashboard/customers", label: "Clientes" },
  { href: "dashboard/settings", label: "Configuración" },
]

export default async function VendorDashboardLayout({ children, params }: Props) {
  const { tenantSlug } = await params

  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    redirect(`/${tenantSlug}/login`)
  }

  await connectDB()
  const { Store } = await getTenantModels(tenantSlug)
  const store = await Store.findOne().lean()

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-5 border-b">
          <p className="font-bold text-sm truncate">{store?.name ?? tenantSlug}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${store?.isLive ? "bg-red-500 animate-pulse" : "bg-muted-foreground/40"}`}
            />
            <Badge variant={store?.isLive ? "destructive" : "secondary"} className="text-xs py-0 px-1.5">
              {store?.isLive ? "EN DIRECTO" : "OFFLINE"}
            </Badge>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={`/${tenantSlug}/${item.href}`}
              className="block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          <a
            href="/api/auth/signout"
            className="text-xs text-destructive mt-2 block hover:underline"
          >
            Cerrar sesión
          </a>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
