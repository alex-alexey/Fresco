import { PublicStorefront } from "@/components/storefront/PublicStorefront"
import { getPublicStorefrontBySlug } from "@/lib/storefront"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function StorePage({ params }: Props) {
  const { tenantSlug } = await params
  const storefront = await getPublicStorefrontBySlug(tenantSlug)
  if (!storefront) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Tienda no encontrada.</p>
      </main>
    )
  }

  return <PublicStorefront storefront={storefront} />
}
