import { FadeIn } from "./FadeIn"

const STEPS = [
  {
    number: "01",
    title: "Crea tu tienda",
    description: "Rellena tu perfil en menos de 5 minutos. Obtienes una página pública lista para compartir con tus clientes.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Conecta tu cámara",
    description: "Preparamos tu equipo para emitir en directo con una puesta en marcha rápida y guiada.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Vende en directo",
    description: "Pulsa 'Ir en directo' y tus clientes te ven al instante. Gestiona la cola de turnos online y presencial desde el mismo panel.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Cómo funciona</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            Implantación simple, venta inmediata
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            Diseñado para negocios de barrio. Te acompañamos desde la configuración inicial hasta la primera venta en vivo.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-linear-to-r from-emerald-200 via-cyan-300 to-emerald-200" />

          {STEPS.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.15} className="relative">
              <div className="bg-white/90 rounded-3xl border border-slate-100 p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    {step.icon}
                  </div>
                  <span className="text-4xl font-bold text-gray-100">{step.number}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
