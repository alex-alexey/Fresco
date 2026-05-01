"use client"

import { motion } from "framer-motion"

function LiveMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative mx-auto max-w-2xl w-full"
    >
      {/* Browser chrome */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-green-100 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-100 truncate">
            frescoenvivo.com/pescaderia-el-faro
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Pescadería El Faro</h3>
              <p className="text-xs text-gray-500 mt-0.5">Productos frescos del día</p>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-xs font-semibold text-red-500">En directo</span>
            </div>
          </div>

          {/* Camera feeds */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 flex items-end p-2">
                <span className="text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded-md">Mostrador</span>
              </div>
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-transparent"
              />
            </div>
            <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
              <div className="absolute inset-0 flex items-end p-2">
                <span className="text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded-md">Vitrina</span>
              </div>
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"
              />
            </div>
          </div>

          {/* Viewers count */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="w-5 h-5 rounded-full bg-green-100 border-2 border-white block" />
                ))}
              </div>
              <span className="text-xs text-gray-500">24 viendo</span>
            </div>
            <motion.div
              animate={{ width: ["30%", "55%", "45%", "60%", "30%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="h-1 rounded-full bg-green-200 flex-1"
            />
          </div>
        </div>
      </div>

      {/* Floating badges — hidden on small screens to avoid overflow */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -right-4 lg:-right-6 top-14 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs hidden sm:block"
      >
        <p className="text-gray-500">Turno actual</p>
        <p className="font-bold text-gray-900">María García</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -left-4 lg:-left-6 bottom-14 bg-green-500 rounded-xl shadow-lg px-3 py-2 text-xs text-white hidden sm:block"
      >
        <p className="opacity-80">Nuevos en cola</p>
        <p className="font-bold">+3 clientes</p>
      </motion.div>
    </motion.div>
  )
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/60 via-white to-white pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                />
                Streaming en tiempo real para tu negocio
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]"
            >
              Vende en directo.{" "}
              <span className="text-green-500">Sin complicaciones.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0"
            >
              La plataforma de streaming para pescaderías, carnicerías y fruterías.
              Conecta con tus clientes en tiempo real desde tu tienda.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3"
            >
              <a
                href="#precios"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Empieza gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-full border border-gray-200 transition-colors text-sm"
              >
                Ver cómo funciona
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-sm text-gray-400"
            >
              {["Sin tarjeta de crédito", "14 días gratis", "Cancela cuando quieras"].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Mockup */}
          <LiveMockup />
        </div>
      </div>
    </section>
  )
}
