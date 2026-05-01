import { FadeIn } from "./FadeIn"

const PLANS = [
  {
    name: "Básico",
    price: "29",
    description: "Para empezar a vender en directo sin complicaciones.",
    mode: "Con alta inicial",
    note: "Desde 749€ de alta (hardware + instalación)",
    features: ["1 cámara", "Cola hasta 10 turnos", "Página pública", "Soporte por email"],
    cta: "Contactar ahora",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "59",
    description: "Para negocios con más volumen y más de una cámara.",
    mode: "Con alta inicial",
    note: "Desde 999€ de alta (hardware + instalación)",
    features: ["3 cámaras simultáneas", "Cola ilimitada", "Informes de actividad", "Soporte por email"],
    cta: "Contactar ahora",
    highlighted: true,
  },
  {
    name: "Business",
    price: "99",
    description: "Máximo rendimiento y soporte prioritario.",
    mode: "Con alta inicial",
    note: "Desde 1149€ de alta (hardware + instalación)",
    features: ["4 cámaras simultáneas", "Cola ilimitada", "Informes avanzados", "Soporte prioritario"],
    cta: "Contactar ahora",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Precios</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">Sin letra pequeña</h2>
          <p className="text-slate-500 mt-4">Dos modalidades: cuota + alta inicial o hardware incluido con permanencia.</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.12}>
              <div
                className={`rounded-2xl p-8 border h-full flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-300/40 md:scale-105"
                    : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-bold bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full mb-4 self-start">
                    Más popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-2 uppercase tracking-wide ${plan.highlighted ? "text-emerald-200" : "text-emerald-700"}`}>
                  {plan.mode}
                </p>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/80" : "text-gray-500"}`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.price}€
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlighted ? "text-white/70" : "text-gray-400"}`}>
                    /mes
                  </span>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <svg
                        className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-emerald-200" : "text-emerald-500"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={plan.highlighted ? "text-white/90" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <p className={`text-xs mb-4 ${plan.highlighted ? "text-white/70" : "text-slate-500"}`}>
                  {plan.note}
                </p>

                <a
                  href="#contacto"
                  className={`block text-center py-3 rounded-full text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
