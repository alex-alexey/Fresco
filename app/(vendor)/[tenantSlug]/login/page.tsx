import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { getTenantModels } from "@/lib/db/tenant-models"
import { VendorLoginForm } from "./VendorLoginForm"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

function darkenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export default async function VendorLoginPage({ params }: Props) {
  const { tenantSlug } = await params

  await connectDB()
  const tenant = await Tenant.findOne({ slug: tenantSlug, status: "active" }).lean()
  if (!tenant) notFound()

  const session = await auth()
  if (session?.user.type === "vendor" && session.user.tenantSlug === tenantSlug) {
    redirect(`/${tenantSlug}/dashboard`)
  }

  const { Store } = await getTenantModels(tenantSlug)
  const store = await Store.findOne().lean()

  const primaryColor = store?.theme?.primaryColor ?? "#22c55e"
  const logoUrl = store?.logoUrl ?? null
  const description = store?.description || null
  const storeName = store?.name ?? tenant.name

  const initials = storeName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()

  const darkColor = darkenHex(primaryColor, 60)

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo: marca del negocio */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${darkColor} 0%, ${primaryColor} 100%)` }}
      >
        {/* Patrón de fondo sutil */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='60' cy='0' r='2'/%3E%3Ccircle cx='0' cy='60' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo y nombre */}
        <div className="relative z-10">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={72}
              height={72}
              className="rounded-2xl object-cover shadow-xl mb-8"
            />
          ) : (
            <div
              className="w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl mb-8"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", width: 72, height: 72 }}
            >
              {initials}
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">{storeName}</h1>
          {description && (
            <p className="text-lg leading-relaxed max-w-xs" style={{ opacity: 0.75 }}>
              {description}
            </p>
          )}
        </div>

        {/* Pie: branding FrescoEnVivo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold">F</span>
            </div>
            <span className="text-sm font-medium" style={{ opacity: 0.7 }}>
              FrescoEnVivo
            </span>
          </div>
          <p className="text-xs mt-1" style={{ opacity: 0.45 }}>
            Plataforma de venta en directo
          </p>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Solo en móvil: cabecera con logo e iniciales */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-3 shadow"
              style={{ backgroundColor: primaryColor }}
            >
              {initials}
            </div>
            <p className="font-semibold text-lg">{storeName}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground mt-1 text-sm">Accede al panel de tu tienda</p>
          </div>

          <VendorLoginForm tenantSlug={tenantSlug} />

          <p className="text-center text-xs text-muted-foreground mt-6">
            <a href={`/${tenantSlug}`} className="hover:underline underline-offset-4">
              Ver tienda pública →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
