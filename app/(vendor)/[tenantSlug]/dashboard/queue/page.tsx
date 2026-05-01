import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QueuePanel } from "./QueuePanel"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function QueuePage({ params }: Props) {
  const { tenantSlug } = await params
  const session = await auth()
  if (!session?.user || session.user.type !== "vendor" || session.user.tenantSlug !== tenantSlug) {
    redirect(`/${tenantSlug}/login`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de turnos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Los clientes pueden coger turno desde{" "}
            <a href={`/${tenantSlug}/turno`} target="_blank"
              className="underline underline-offset-2 hover:text-foreground transition-colors">
              /{tenantSlug}/turno
            </a>
          </p>
        </div>
        <a
          href={`/${tenantSlug}/turno`}
          target="_blank"
          className="text-xs border rounded-md px-3 py-1.5 hover:bg-muted transition-colors text-muted-foreground"
        >
          Abrir kiosco ↗
        </a>
      </div>

      <QueuePanel tenantSlug={tenantSlug} />
    </div>
  )
}
