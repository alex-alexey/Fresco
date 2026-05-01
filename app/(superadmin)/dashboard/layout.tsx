import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"
import { SidebarNav } from "./SidebarNav"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

const ROLE_LABELS: Record<SuperadminRole, string> = {
  ADMIN: "Admin",
  BILLING: "Facturación",
  SUPPORT: "Soporte",
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.type !== "superadmin") redirect("/ops")

  const role = session.user.role

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-60 border-r bg-card flex flex-col sticky top-0 h-screen">
        {/* Cabecera */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">FrescoEnVivo</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Panel de control</p>
            </div>
          </div>
        </div>

        {/* Navegación con estado activo */}
        <SidebarNav role={role} />

        {/* Usuario */}
        <div className="p-4 border-t space-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{session.user.email}</p>
            <span className="inline-flex mt-1.5 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {ROLE_LABELS[role]}
            </span>
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-fit"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </a>
        </div>
      </aside>

      <main className="flex-1 min-h-screen p-8 overflow-auto">{children}</main>
    </div>
  )
}
