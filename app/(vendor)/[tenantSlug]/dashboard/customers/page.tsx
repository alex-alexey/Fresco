import { CustomersPanel } from "./CustomersPanel"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function CustomersPage({ params }: Props) {
  const { tenantSlug } = await params

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Clientes & Bloqueados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historial de clientes online y gestión de números bloqueados.
        </p>
      </div>
      <CustomersPanel tenantSlug={tenantSlug} />
    </div>
  )
}
