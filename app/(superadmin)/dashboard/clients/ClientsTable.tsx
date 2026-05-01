"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

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

export type TenantRow = {
  id: string
  name: string
  email: string
  slug: string
  planName: string | null
  status: string
  createdAt: string
}

export function ClientsTable({ tenants }: { tenants: TenantRow[] }) {
  const router = useRouter()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Negocio</TableHead>
            <TableHead>Slug / URL</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((t) => (
            <TableRow
              key={t.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/clients/${t.id}`)}
            >
              <TableCell>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.email}</p>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{t.slug}</code>
              </TableCell>
              <TableCell>
                <span className="text-sm">{t.planName ?? "—"}</span>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[t.status] ?? "secondary"}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.createdAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
