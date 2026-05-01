"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWebRTC } from "@/hooks/useWebRTC"

interface QueueEntry {
  _id: string
  customerName: string
  customerPhone: string | null
  position: number
  type: "online" | "presencial"
  status: string
  callRoom: string | null
  createdAt: string
}

interface Props {
  tenantSlug: string
}

function minutesAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return "ahora mismo"
  if (diff === 1) return "hace 1 min"
  return `hace ${diff} min`
}

function CallControls({
  isMuted,
  isCameraEnabled,
  hasRemoteVideo,
  onMute,
  onCamera,
  onHangup,
}: {
  isMuted: boolean
  isCameraEnabled: boolean
  hasRemoteVideo: boolean
  onMute: () => void
  onCamera: () => void
  onHangup: () => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onMute}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          isMuted ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        {isMuted ? "🔇 Silenciado" : "🎙️ Micro activo"}
      </button>
      {hasRemoteVideo && (
        <span className="text-xs text-muted-foreground px-2">
          📹 El cliente tiene vídeo activo
        </span>
      )}
      <button
        onClick={onHangup}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        Colgar
      </button>
    </div>
  )
}

export function QueuePanel({ tenantSlug }: Props) {
  const [called, setCalled] = useState<QueueEntry | null>(null)
  const [waiting, setWaiting] = useState<QueueEntry[]>([])
  const [servedToday, setServedToday] = useState(0)
  const [loadingNext, setLoadingNext] = useState(false)
  const [loadingServed, setLoadingServed] = useState(false)
  const [callRoom, setCallRoom] = useState<string | null>(null)

  const sendPath = callRoom ? `/api/vendor/${tenantSlug}/call/${callRoom}/signal` : null
  const pollPath = callRoom ? `/api/vendor/${tenantSlug}/call/${callRoom}/signal` : null

  const { remoteVideoRef, status: callStatus, isMuted, hasRemoteVideo, toggleMute, hangup } = useWebRTC({
    callRoom,
    isInitiator: true,
    callType: callRoom ? "audio" : null,
    sendPath,
    pollPath,
    onEnded: () => setCallRoom(null),
  })

  const fetchQueue = useCallback(async () => {
    const res = await fetch(`/api/vendor/${tenantSlug}/queue`)
    if (!res.ok) return
    const data = await res.json()
    setCalled(data.called)
    setWaiting(data.waiting)
    setServedToday(data.servedToday)
    if (!data.called) setCallRoom(null)
  }, [tenantSlug])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  async function handleCallNext() {
    setLoadingNext(true)
    try {
      const res = await fetch(`/api/vendor/${tenantSlug}/queue/next`, { method: "POST" })
      if (!res.ok) return
      const data = await res.json()
      if (data.called) {
        setCalled(data.called)
        setWaiting((prev) => prev.filter((e) => e._id !== data.called._id))
      }
      if (data.callRoom) setCallRoom(data.callRoom)
    } finally {
      setLoadingNext(false)
    }
  }

  async function handleServed() {
    if (!called) return
    setLoadingServed(true)
    hangup()
    try {
      const res = await fetch(`/api/vendor/${tenantSlug}/queue/${called._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      })
      if (res.ok) await fetchQueue()
    } finally {
      setLoadingServed(false)
    }
  }

  async function handleCancel(id: string) {
    if (called?._id === id) { hangup(); setCallRoom(null) }
    await fetch(`/api/vendor/${tenantSlug}/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    })
    await fetchQueue()
  }

  async function handleBlock(phone: string, entryId?: string) {
    if (!confirm(`¿Bloquear el número ${phone}? No podrá unirse a la cola.`)) return
    if (entryId) await handleCancel(entryId)
    await fetch(`/api/vendor/${tenantSlug}/blocked-phones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
  }

  const isOnlineCall = called?.type === "online" && !!callRoom
  const callConnecting = isOnlineCall && callStatus === "connecting"
  const callActive = isOnlineCall && callStatus === "connected"

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">En espera</p>
          <p className="text-3xl font-black">{waiting.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Atendidos hoy</p>
          <p className="text-3xl font-black">{servedToday}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Turno actual</p>
          <p className="text-3xl font-black">{called ? `#${called.position}` : "—"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Current turn + call */}
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Atendiendo ahora</h2>

          <AnimatePresence mode="wait">
            {called ? (
              <motion.div
                key={called._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black text-3xl flex-shrink-0 border border-green-100">
                    #{called.position}
                  </div>
                  <div>
                    <p className="font-bold text-xl">
                      {called.customerName === "—" ? "Cliente presencial" : called.customerName}
                    </p>
                    {called.customerPhone && (
                      <p className="text-sm text-muted-foreground">{called.customerPhone}</p>
                    )}
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                      called.type === "online" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                    }`}>
                      {called.type === "online" ? "Online" : "Presencial"}
                    </span>
                  </div>
                </div>

                {/* WebRTC call UI */}
                {isOnlineCall && (
                  <div className={`rounded-xl p-4 space-y-3 ${
                    callActive ? "bg-green-50 border border-green-200" : "bg-muted/40 border"
                  }`}>
                    <div className="flex items-center gap-2">
                      {callActive ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-semibold text-green-700">Llamada en curso</span>
                        </>
                      ) : callConnecting ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-sm font-semibold text-amber-700">Esperando que el cliente acepte…</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                          <span className="text-sm text-muted-foreground">Preparando llamada…</span>
                        </>
                      )}
                    </div>

                    {/* Remote video (customer's camera if they chose video) */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`w-full rounded-lg bg-black aspect-video ${callActive && hasRemoteVideo ? "block" : "hidden"}`}
                    />

                    {callActive && (
                      <CallControls
                        isMuted={isMuted}
                        isCameraEnabled={false}
                        hasRemoteVideo={hasRemoteVideo}
                        onMute={toggleMute}
                        onCamera={() => {}}
                        onHangup={() => { hangup(); handleServed() }}
                      />
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleServed}
                    disabled={loadingServed}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Atendido
                  </button>
                  <button
                    onClick={() => handleCancel(called._id)}
                    className="px-4 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  {called.customerPhone && (
                    <button
                      onClick={() => handleBlock(called.customerPhone!, called._id)}
                      title="Bloquear número"
                      className="px-3 py-2.5 rounded-xl border text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      🚫
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-8 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sin turno activo</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleCallNext}
            disabled={loadingNext || waiting.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
          >
            {loadingNext
              ? "Llamando…"
              : `Llamar siguiente${waiting.length > 0 ? ` (#${waiting[0]?.position})` : ""}`
            }
          </button>
        </div>

        {/* Waiting list */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cola de espera</h2>
            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{waiting.length}</span>
          </div>

          {waiting.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">La cola está vacía</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {waiting.map((entry, i) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center text-sm font-bold flex-shrink-0">
                      #{entry.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.customerName === "—" ? "Cliente presencial" : entry.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">{minutesAgo(entry.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      entry.type === "online" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                    }`}>
                      {entry.type === "online" ? "web" : "pres."}
                    </span>
                    <button onClick={() => handleCancel(entry._id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" title="Cancelar turno">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {entry.customerPhone && (
                      <button
                        onClick={() => handleBlock(entry.customerPhone!, entry._id)}
                        className="text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0 text-sm"
                        title="Bloquear número"
                      >
                        🚫
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
