"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "BILLING", "SUPPORT"] as SuperadminRole[] },
  { href: "/dashboard/clients", label: "Clientes", icon: Users, roles: ["ADMIN"] as SuperadminRole[] },
  { href: "/dashboard/billing", label: "Facturación", icon: CreditCard, roles: ["ADMIN", "BILLING"] as SuperadminRole[] },
  { href: "/dashboard/support", label: "Soporte", icon: Headphones, roles: ["ADMIN", "SUPPORT"] as SuperadminRole[] },
]

export function SidebarNav({ role }: { role: SuperadminRole }) {
  const pathname = usePathname()
  const visible = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {visible.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
