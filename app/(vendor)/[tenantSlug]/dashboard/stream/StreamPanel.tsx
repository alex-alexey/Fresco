"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useCameras } from "@/hooks/useCameras"
import { useWebRTCHost } from "@/hooks/useWebRTCHost"

interface Props {
  tenantSlug: string
  maxCameras: number
  initialIsLive: boolean
}

interface QueueStats {
  onlineToday: number
  presencialToday: number
  waiting: number
}

function CameraPreview({ deviceId, label }: { deviceId: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s })
      .catch(() => {})
    return () => { stream?.getTracks().forEach((t) => t.stop()) }
  }, [deviceId])

  return (
    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-0.5 rounded">{label}</span>
    </div>
  )
}

function LivePreview({ stream, label }: { stream: MediaStream; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])
  return (
    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-white font-medium">{label}</span>
      </div>
    </div>
  )
}

export function StreamPanel({ tenantSlug, maxCameras, initialIsLive }: Props) {
  const { cameras, selectedIds, permissionDenied, loading, toggleCamera } = useCameras()
  const [isLive, setIsLive] = useState(initialIsLive)
  const [localStreams, setLocalStreams] = useState<MediaStream[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queueStats, setQueueStats] = useState<QueueStats>({ onlineToday: 0, presencialToday: 0, waiting: 0 })

  const { viewerCount } = useWebRTCHost({ isLive, streams: localStreams, tenantSlug })

  const fetchQueueStats = useCallback(async () => {
    const res = await fetch(`/api/vendor/${tenantSlug}/queue`).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setQueueStats({
      onlineToday: data.onlineToday ?? 0,
      presencialToday: data.presencialToday ?? 0,
      waiting: data.waiting?.length ?? 0,
    })
  }, [tenantSlug])

  useEffect(() => {
    fetchQueueStats()
    const interval = setInterval(fetchQueueStats, 30_000)
    return () => clearInterval(interval)
  }, [fetchQueueStats])

  async function goLive() {
    if (selectedIds.length === 0) return
    setError(null)
    setActionLoading(true)
    try {
      // Capture camera streams before marking as live
      const streams = await Promise.all(
        selectedIds.map((deviceId) =>
          navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
        )
      )

      const res = await fetch(`/api/vendor/${tenantSlug}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraCount: selectedIds.length }),
      })
      const data = await res.json()
      if (!res.ok) {
        streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
        setError(data.error ?? "Error al iniciar la transmisión")
        return
      }
      setLocalStreams(streams)
      setIsLive(true)
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setActionLoading(false)
    }
  }

  async function stopStream() {
    setError(null)
    setActionLoading(true)
    // Stop all camera tracks immediately
    localStreams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
    setLocalStreams([])
    setIsLive(false)
    try {
      const res = await fetch(`/api/vendor/${tenantSlug}/stream`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Error al detener la transmisión")
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={isLive ? "destructive" : "secondary"} className="text-sm px-3 py-1">
          {isLive ? "🔴 EN DIRECTO" : "OFFLINE"}
        </Badge>
        {isLive && (
          <span className="text-xs text-muted-foreground">
            {viewerCount === 0 ? "Sin espectadores" : `${viewerCount} espectador${viewerCount !== 1 ? "es" : ""}`}
          </span>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {permissionDenied && (
        <Alert variant="destructive">
          <AlertDescription>
            No se ha podido acceder a la cámara. Comprueba los permisos del navegador.
          </AlertDescription>
        </Alert>
      )}

      {!isLive && (
        <>
          <div>
            <p className="text-sm font-medium mb-3">
              Selecciona las cámaras ({selectedIds.length}/{maxCameras})
            </p>
            {loading && <p className="text-sm text-muted-foreground">Detectando cámaras...</p>}
            {!loading && cameras.length === 0 && !permissionDenied && (
              <p className="text-sm text-muted-foreground">No se detectaron cámaras conectadas.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cameras.map((cam) => {
                const selected = selectedIds.includes(cam.deviceId)
                const disabled = !selected && selectedIds.length >= maxCameras
                return (
                  <button
                    key={cam.deviceId}
                    onClick={() => toggleCamera(cam.deviceId, maxCameras)}
                    disabled={disabled}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selected ? "border-primary bg-primary/5"
                        : disabled ? "border-border opacity-40 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`} />
                    <span className="text-sm truncate">{cam.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Vista previa</p>
              <div className={`grid gap-4 ${selectedIds.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-md"}`}>
                {selectedIds.map((id) => {
                  const cam = cameras.find((c) => c.deviceId === id)
                  return cam ? <CameraPreview key={id} deviceId={id} label={cam.label} /> : null
                })}
              </div>
            </div>
          )}

          <Button
            onClick={goLive}
            disabled={selectedIds.length === 0 || actionLoading}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {actionLoading ? "Iniciando..." : "Ir en directo"}
          </Button>
        </>
      )}

      {isLive && (
        <div className="space-y-4">
          {/* Live camera previews */}
          {localStreams.length > 0 && (
            <div className={`grid gap-3 ${localStreams.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-md"}`}>
              {localStreams.map((stream, i) => (
                <LivePreview key={stream.id} stream={stream} label={`Cámara ${i + 1}`} />
              ))}
            </div>
          )}

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Transmisión activa</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
              Tus clientes pueden verte en directo ahora mismo.
            </p>
          </div>

          {/* Queue stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
              <p className="text-xs text-muted-foreground">Web (hoy)</p>
              <p className="text-2xl font-black">{queueStats.onlineToday}</p>
            </div>
            <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
              <p className="text-xs text-muted-foreground">Presencial (hoy)</p>
              <p className="text-2xl font-black">{queueStats.presencialToday}</p>
            </div>
            <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
              <p className="text-xs text-muted-foreground">En espera</p>
              <p className="text-2xl font-black">{queueStats.waiting}</p>
            </div>
          </div>

          <Button
            onClick={stopStream}
            disabled={actionLoading}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {actionLoading ? "Deteniendo..." : "Detener transmisión"}
          </Button>
        </div>
      )}
    </div>
  )
}
