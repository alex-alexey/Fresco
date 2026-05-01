"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  tenantSlug: string
  storeName: string
  logoUrl: string | null
  primaryColor: string
}

type State = "idle" | "ticket" | "printing"

const RESET_SECONDS = 12

export function KioskView({ tenantSlug, storeName, logoUrl, primaryColor }: Props) {
  const [state, setState] = useState<State>("idle")
  const [ticketNumber, setTicketNumber] = useState<number | null>(null)
  const [waitingAhead, setWaitingAhead] = useState(0)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESET_SECONDS)

  // Countdown to reset
  useEffect(() => {
    if (state !== "ticket") return
    setCountdown(RESET_SECONDS)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); setState("idle"); return RESET_SECONDS }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state])

  async function handleTakeNumber() {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/${tenantSlug}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "presencial" }),
      })
      const data = await res.json()
      if (!res.ok) return

      // Get how many are ahead
      const countRes = await fetch(`/api/public/${tenantSlug}/queue`)
      const countData = await countRes.json()

      setTicketNumber(data.position)
      setWaitingAhead(Math.max(0, (countData.waiting ?? 1) - 1))
      setState("ticket")
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Print-only ticket */}
      <div className="hidden print:block print:fixed print:inset-0 print:flex print:items-center print:justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-lg font-bold">{storeName}</p>
          <div className="border-t border-b border-dashed border-gray-400 py-6 my-4">
            <p className="text-sm text-gray-500 mb-2">Tu número es</p>
            <p className="text-8xl font-black">#{ticketNumber}</p>
          </div>
          {waitingAhead === 0 ? (
            <p className="text-base">¡Eres el siguiente!</p>
          ) : (
            <p className="text-base">{waitingAhead} persona{waitingAhead !== 1 ? "s" : ""} delante de ti</p>
          )}
          <p className="text-xs text-gray-400 mt-4">
            {new Date().toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
          <p className="text-xs text-gray-400">Por favor, espera a ser llamado</p>
        </div>
      </div>

      {/* Screen UI */}
      <div className="print:hidden min-h-screen flex flex-col items-center justify-center select-none"
        style={{ background: `linear-gradient(160deg, ${primaryColor}12 0%, white 50%)` }}>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}>
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-gray-800 text-lg">{storeName}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-10 text-center px-8"
            >
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black text-gray-900">
                  ¿Deseas ser atendido?
                </h1>
                <p className="text-lg text-gray-400">Pulsa el botón para coger tu turno</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleTakeNumber}
                disabled={loading}
                className="w-64 h-64 rounded-3xl text-white font-black text-3xl shadow-2xl flex flex-col items-center justify-center gap-4 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 20px 60px ${primaryColor}50` }}
              >
                {loading ? (
                  <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    COGER TURNO
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {state === "ticket" && ticketNumber !== null && (
            <motion.div
              key="ticket"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.35 }}
              className="flex flex-col items-center gap-8 text-center px-8"
            >
              {/* Big number */}
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-400 uppercase tracking-widest">Tu número es</p>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-48 h-48 rounded-3xl flex items-center justify-center text-white font-black text-7xl shadow-2xl"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 20px 60px ${primaryColor}50` }}
                >
                  #{ticketNumber}
                </motion.div>
              </div>

              <div className="space-y-1">
                {waitingAhead === 0 ? (
                  <p className="text-2xl font-bold text-gray-800">¡Eres el siguiente!</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-800">
                    {waitingAhead} persona{waitingAhead !== 1 ? "s" : ""} delante de ti
                  </p>
                )}
                <p className="text-gray-400">Espera a que te llamen</p>
              </div>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl border-2 font-semibold text-lg transition-colors hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir ticket
              </button>

              {/* Countdown */}
              <p className="text-sm text-gray-300">
                Volviendo al inicio en {countdown}s
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
