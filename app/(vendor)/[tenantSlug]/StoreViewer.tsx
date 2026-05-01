"use client"

import { useState, useEffect, useRef } from "react"
import { useWebRTCViewer } from "@/hooks/useWebRTCViewer"

interface Props {
  tenantSlug: string
  initialIsLive: boolean
  storeName: string
  primaryColor: string
  cameraCount: number
}

function CameraIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CameraSlot({ index, isLive, primaryColor, featured = false }: {
  index: number; isLive: boolean; primaryColor: string; featured?: boolean
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex items-center justify-center aspect-video"
      style={{
        backgroundColor: isLive ? `${primaryColor}08` : "#f9fafb",
        borderWidth: 1,
        borderStyle: isLive ? "solid" : "dashed",
        borderColor: isLive ? `${primaryColor}30` : "#e5e7eb",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl flex items-center justify-center"
          style={{ width: featured ? 56 : 44, height: featured ? 56 : 44, backgroundColor: isLive ? `${primaryColor}15` : "#f3f4f6" }}>
          <CameraIcon className={featured ? "w-7 h-7" : "w-5 h-5"}
            style={{ color: isLive ? primaryColor : "#d1d5db" }} />
        </div>
        <span className={`font-medium ${featured ? "text-sm" : "text-xs"}`}
          style={{ color: isLive ? `${primaryColor}90` : "#9ca3af" }}>
          {isLive ? "Conectando…" : `Cámara ${index + 1}`}
        </span>
      </div>
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
          <span className="text-xs font-semibold" style={{ color: primaryColor }}>EN DIRECTO</span>
        </div>
      )}
    </div>
  )
}

function VideoSlot({ stream, index, primaryColor, featured = false }: {
  stream: MediaStream; index: number; primaryColor: string; featured?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    video.play().catch(() => {})
  }, [stream])
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-black ${featured ? "" : ""} aspect-video`}>
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-white">EN DIRECTO</span>
      </div>
      <span className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
        Cámara {index + 1}
      </span>
    </div>
  )
}

function PlaceholderGrid({ count, isLive, primaryColor }: { count: number; isLive: boolean; primaryColor: string }) {
  if (count === 1) return <CameraSlot index={0} isLive={isLive} primaryColor={primaryColor} featured />
  if (count === 2) return (
    <div className="grid grid-cols-2 gap-3">
      <CameraSlot index={0} isLive={isLive} primaryColor={primaryColor} />
      <CameraSlot index={1} isLive={isLive} primaryColor={primaryColor} />
    </div>
  )
  if (count === 3) return (
    <div className="space-y-3">
      <CameraSlot index={0} isLive={isLive} primaryColor={primaryColor} featured />
      <div className="grid grid-cols-2 gap-3">
        <CameraSlot index={1} isLive={isLive} primaryColor={primaryColor} />
        <CameraSlot index={2} isLive={isLive} primaryColor={primaryColor} />
      </div>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CameraSlot key={i} index={i} isLive={isLive} primaryColor={primaryColor} />
      ))}
    </div>
  )
}

function VideoGrid({ streams, primaryColor }: { streams: MediaStream[]; primaryColor: string }) {
  const count = streams.length
  if (count === 1) return <VideoSlot stream={streams[0]!} index={0} primaryColor={primaryColor} featured />
  if (count === 2) return (
    <div className="grid grid-cols-2 gap-3">
      <VideoSlot stream={streams[0]!} index={0} primaryColor={primaryColor} />
      <VideoSlot stream={streams[1]!} index={1} primaryColor={primaryColor} />
    </div>
  )
  if (count === 3) return (
    <div className="space-y-3">
      <VideoSlot stream={streams[0]!} index={0} primaryColor={primaryColor} featured />
      <div className="grid grid-cols-2 gap-3">
        <VideoSlot stream={streams[1]!} index={1} primaryColor={primaryColor} />
        <VideoSlot stream={streams[2]!} index={2} primaryColor={primaryColor} />
      </div>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {streams.map((s, i) => <VideoSlot key={s.id} stream={s} index={i} primaryColor={primaryColor} />)}
    </div>
  )
}

export function StoreViewer({ tenantSlug, initialIsLive, storeName, primaryColor, cameraCount: initialCount }: Props) {
  const [isLive, setIsLive] = useState(initialIsLive)
  const [count, setCount] = useState(Math.max(1, initialCount))

  const { status, videoStreams } = useWebRTCViewer({ tenantSlug, isLive })

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/public/${tenantSlug}/stream`).catch(() => null)
      if (!res?.ok) return
      const data = await res.json()
      setIsLive(data.isLive)
      setCount(Math.max(1, data.cameraCount))
    }, 10_000)
    return () => clearInterval(interval)
  }, [tenantSlug])

  if (!isLive) {
    return (
      <div className="space-y-3">
        <PlaceholderGrid count={count} isLive={false} primaryColor={primaryColor} />
        <p className="text-center text-sm text-gray-400 pt-2">
          {storeName} no está transmitiendo ahora mismo · Vuelve más tarde
        </p>
      </div>
    )
  }

  // Live but still connecting/no video yet → show animated placeholders
  if (status !== "connected" || videoStreams.length === 0) {
    return (
      <div className="space-y-3">
        <PlaceholderGrid count={count} isLive={true} primaryColor={primaryColor} />
        <p className="text-center text-xs text-gray-400">
          {status === "joining" || status === "connecting" ? "Conectando con la transmisión…" : "En directo"}
        </p>
      </div>
    )
  }

  return <VideoGrid streams={videoStreams} primaryColor={primaryColor} />
}
