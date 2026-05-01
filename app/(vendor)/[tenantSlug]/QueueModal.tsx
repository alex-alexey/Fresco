"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useWebRTC, type CallType } from "@/hooks/useWebRTC"

interface Props {
  tenantSlug: string
  primaryColor: string
}

type Stage = "idle" | "form" | "waiting" | "incoming" | "in-call" | "ended"

export function QueueModal({ tenantSlug, primaryColor }: Props) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("idle")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [callRoom, setCallRoom] = useState<string | null>(null)
  const [callType, setCallType] = useState<CallType | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  // Ringtone: plays while stage === "incoming" and no callType chosen yet
  useEffect(() => {
    if (stage !== "incoming" || callType !== null) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    let stopped = false
    let timeout: ReturnType<typeof setTimeout>

    function beep(startTime: number, duration: number) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 480
      gain.gain.setValueAtTime(0.25, startTime)
      gain.gain.linearRampToValueAtTime(0, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.05)
    }

    function ring() {
      if (stopped) return
      const now = ctx.currentTime
      beep(now, 0.4)
      beep(now + 0.55, 0.4)
      timeout = setTimeout(ring, 2200)
    }

    ring()
    return () => {
      stopped = true
      clearTimeout(timeout)
      ctx.close()
    }
  }, [stage, callType])

  const sendPath = callRoom ? `/api/public/${tenantSlug}/call/${callRoom}/signal` : null
  const pollPath = callRoom ? `/api/public/${tenantSlug}/call/${callRoom}/signal` : null

  const { localVideoRef, remoteVideoRef, status: callStatus, isMuted, isCameraEnabled, toggleMute, toggleCamera, hangup } = useWebRTC({
    callRoom,
    isInitiator: false,
    callType,
    sendPath,
    pollPath,
    onConnected: () => setStage("in-call"),
    onEnded: () => setStage("ended"),
  })

  useEffect(() => {
    if (stage !== "waiting" || !entryId) return
    stopPolling()
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/public/${tenantSlug}/queue/${entryId}`).catch(() => null)
      if (!res?.ok) return
      const data = await res.json()
      if (data.status === "called" && data.callRoom) {
        stopPolling()
        setCallRoom(data.callRoom)
        setStage("incoming")
      } else if (data.status === "served" || data.status === "cancelled") {
        stopPolling()
        setStage("ended")
      }
    }, 5000)
    return stopPolling
  }, [stage, entryId, tenantSlug])

  function reset() {
    stopPolling()
    hangup()
    setStage("idle")
    setName("")
    setPhone("")
    setPosition(null)
    setEntryId(null)
    setError(null)
    setCallRoom(null)
    setCallType(null)
  }

  function handleClose() {
    setOpen(false)
    if (stage === "ended" || stage === "idle") reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/public/${tenantSlug}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: name, customerPhone: phone, type: "online" }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al unirse a la cola"); return }
      setPosition(data.position)
      setEntryId(data.id)
      setStage("waiting")
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  function handleAccept(type: CallType) {
    setCallType(type)
    // stage transitions to "in-call" via onConnected callback once WebRTC connects
  }

  function handleHangup() {
    hangup()
    setStage("ended")
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (stage === "idle") setStage("form") }}
        style={{ backgroundColor: primaryColor }}
        className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-full transition-opacity hover:opacity-90 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {stage === "waiting" ? `En espera · #${position}` : stage === "incoming" ? "📞 Te llaman" : "Coger turno"}
      </button>

      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              {/* Form */}
              {stage === "form" && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Coger turno online</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nombre</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        placeholder="Tu nombre" disabled={loading}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                        placeholder="+34 600 000 000" disabled={loading}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                    </div>
                    <button type="submit" disabled={loading}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full text-white font-semibold py-3 rounded-full text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>Uniéndome…</>
                      ) : "Unirme a la cola"}
                    </button>
                  </form>
                </>
              )}

              {/* Waiting */}
              {stage === "waiting" && (
                <div className="text-center space-y-5 py-2">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white"
                    style={{ backgroundColor: primaryColor }}>
                    {position}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900">¡Ya estás en cola!</h3>
                    <p className="text-gray-500 text-sm">Tu turno es el <strong>nº {position}</strong></p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Esperando tu turno…
                  </div>
                  <p className="text-xs text-gray-400">Mantén esta ventana abierta para recibir la llamada</p>
                  <button onClick={handleClose} className="text-xs text-gray-400 hover:text-gray-600 underline">
                    Cerrar (perderás la notificación)
                  </button>
                </div>
              )}

              {/* Incoming call — customer chooses audio or video */}
              {stage === "incoming" && (
                <div className="text-center space-y-6 py-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <svg className="w-12 h-12" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">¡Te están llamando!</h3>
                    <p className="text-gray-500 text-sm mt-1">Elige cómo quieres hablar con el vendedor</p>
                  </div>
                  {!callType ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAccept("audio")}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      >
                        <span className="text-2xl">📞</span>
                        <span className="text-sm font-semibold text-gray-700">Solo audio</span>
                      </button>
                      <button
                        onClick={() => handleAccept("video")}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors"
                        style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
                      >
                        <span className="text-2xl">📹</span>
                        <span className="text-sm font-semibold" style={{ color: primaryColor }}>Videollamada</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Conectando…
                    </div>
                  )}
                </div>
              )}

              {/* In call */}
              {stage === "in-call" && (
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-green-50">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Llamada en curso</h3>
                    <p className="text-gray-500 text-sm">Estás hablando con el vendedor</p>
                  </div>

                  {/* Local video preview (customer's own camera) */}
                  {callType === "video" && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-xl bg-black aspect-video"
                    />
                  )}

                  {/* Remote video (vendor's camera — not sent by default but future-proof) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="hidden"
                  />

                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      onClick={toggleMute}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                        isMuted ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {isMuted ? "🔇 Silenciado" : "🎙️ Micro activo"}
                    </button>
                    {callType === "video" && (
                      <button
                        onClick={toggleCamera}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                          !isCameraEnabled ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {isCameraEnabled ? "📹 Cámara activa" : "🚫 Cámara apagada"}
                      </button>
                    )}
                    <button
                      onClick={handleHangup}
                      className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Colgar
                    </button>
                  </div>
                </div>
              )}

              {/* Ended */}
              {stage === "ended" && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-2xl">✓</div>
                  <h3 className="text-xl font-bold text-gray-900">Llamada finalizada</h3>
                  <p className="text-gray-500 text-sm">Gracias por tu visita.</p>
                  <button onClick={() => { reset(); setOpen(false) }}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full text-white font-semibold py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity">
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  )
}
