import { connectDB } from "@/lib/db/mongodb"
import { Tenant } from "@/lib/db/models/Tenant"
import { getOrCreateStore } from "@/lib/db/tenant"
import { StoreNavbar } from "./StoreNavbar"
import { StoreHero } from "./StoreHero"
import { StoreViewer } from "./StoreViewer"
import { FadeIn } from "@/components/landing/FadeIn"

const DAY_LABELS: Record<string, string> = {
  mon: "Lunes", tue: "Martes", wed: "Miércoles",
  thu: "Jueves", fri: "Viernes", sat: "Sábado",
}
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"]
const JS_DAY_TO_KEY: Record<number, string> = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" }

interface Props {
  params: Promise<{ tenantSlug: string }>
}

function SectionLabel({ label, title, primaryColor }: { label: string; title: string; primaryColor: string }) {
  return (
    <div className="text-center mb-12">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: primaryColor }}>{label}</span>
      <h2 className="text-3xl font-bold text-gray-900 mt-2">{title}</h2>
    </div>
  )
}

export default async function StorePage({ params }: Props) {
  const { tenantSlug } = await params

  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean()
  if (!tenant) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Tienda no encontrada.</p>
      </main>
    )
  }

  const store = JSON.parse(JSON.stringify(await getOrCreateStore(tenantSlug, tenant.name)))
  const primaryColor = store.theme?.primaryColor ?? "#22c55e"
  const todayKey = JS_DAY_TO_KEY[new Date().getDay()]
  const hasContact = store.contact?.phone || store.contact?.email || store.contact?.address

  return (
    <main className="min-h-screen bg-white">

      {/* Navbar */}
      <StoreNavbar
        storeName={store.name}
        logoUrl={store.logoUrl ?? null}
        isLive={store.isLive}
        primaryColor={primaryColor}
        tenantSlug={tenantSlug}
      />

      {/* Hero */}
      <div id="inicio">
        <StoreHero
          storeName={store.name}
          description={store.description ?? ""}
          logoUrl={store.logoUrl ?? null}
          isLive={store.isLive}
          primaryColor={primaryColor}
          social={store.social ?? {}}
          tenantSlug={tenantSlug}
        />
      </div>

      {/* Stream viewer */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionLabel label="En directo" title="Transmisión en vivo" primaryColor={primaryColor} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <StoreViewer
              tenantSlug={tenantSlug}
              initialIsLive={store.isLive}
              storeName={store.name}
              primaryColor={primaryColor}
              cameraCount={store.activeCameras?.length ?? 1}
            />
          </FadeIn>
        </div>
      </section>

      {/* Products */}
      {store.products && store.products.length > 0 && (
        <section id="productos" className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <SectionLabel label="Productos" title="Productos destacados" primaryColor={primaryColor} />
            </FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {store.products.map((p: { _id: string; name: string; description?: string; imageUrl?: string | null }, i: number) => (
                <FadeIn key={p._id.toString()} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 group h-full">
                    {p.imageUrl ? (
                      <div className="aspect-square overflow-hidden">
                        <img src={p.imageUrl} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}10` }}>
                        <svg className="w-10 h-10" style={{ color: `${primaryColor}40` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schedule + Contact */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">

            {/* Schedule */}
            {store.schedule && (
              <FadeIn id="horario" direction="left">
                <div>
                  <div className="mb-8">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: primaryColor }}>Horario</span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-2">Cuándo encontrarnos</h2>
                  </div>
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    {DAY_KEYS.map((key, i) => {
                      const day = store.schedule?.[key]
                      const isToday = key === todayKey
                      return (
                        <div key={key}
                          className={`flex items-center justify-between px-5 py-4 ${i !== DAY_KEYS.length - 1 ? "border-b border-gray-50" : ""}`}
                          style={isToday ? { backgroundColor: `${primaryColor}08` } : {}}>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-sm ${isToday ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                              {DAY_LABELS[key]}
                            </span>
                            {isToday && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: primaryColor }}>
                                Hoy
                              </span>
                            )}
                          </div>
                          {day?.closed ? (
                            <span className="text-xs text-gray-300 font-medium">Cerrado</span>
                          ) : (
                            <span className={`text-sm tabular-nums ${isToday ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                              {day?.open} – {day?.close}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Contact */}
            {hasContact && (
              <FadeIn id="contacto" direction="right">
                <div>
                  <div className="mb-8">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: primaryColor }}>Contacto</span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-2">Cómo encontrarnos</h2>
                  </div>
                  <div className="space-y-4">
                    {store.contact?.phone && (
                      <a href={`tel:${store.contact.phone}`}
                        className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-50 transition-all">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}12` }}>
                          <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                          <p className="font-semibold text-gray-900">{store.contact.phone}</p>
                        </div>
                      </a>
                    )}
                    {store.contact?.email && (
                      <a href={`mailto:${store.contact.email}`}
                        className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-50 transition-all">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}12` }}>
                          <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Email</p>
                          <p className="font-semibold text-gray-900">{store.contact.email}</p>
                        </div>
                      </a>
                    )}
                    {store.contact?.address && (
                      <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}12` }}>
                          <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Dirección</p>
                          <p className="font-semibold text-gray-900">{store.contact.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-6 h-6 rounded-md object-cover" />
            ) : (
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: primaryColor }}>
                {store.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-700">{store.name}</span>
          </div>
          <p className="text-xs text-gray-300">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>FrescoEnVivo</span>
          </p>
        </div>
      </footer>

    </main>
  )
}
