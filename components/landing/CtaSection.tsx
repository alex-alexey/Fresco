import { FadeIn } from "./FadeIn"

export function CtaSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="relative bg-slate-900 rounded-3xl px-10 py-16 text-center overflow-hidden border border-slate-800 shadow-2xl shadow-slate-300/40">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/20 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para vender en directo?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
                Agenda una demo y te preparamos una propuesta adaptada a tu tienda y hardware.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-emerald-300 transition-colors text-sm"
                >
                  Contactar ahora
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
