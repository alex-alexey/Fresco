"use client"

import { useEffect, useRef, useState } from "react"

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
}

export type ViewerStatus = "idle" | "joining" | "connecting" | "connected" | "offline"

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 4000): Promise<void> {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") { resolve(); return }
    const timer = setTimeout(() => { pc.onicegatheringstatechange = null; resolve() }, timeoutMs)
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer)
        pc.onicegatheringstatechange = null
        resolve()
      }
    }
  })
}

export function useWebRTCViewer({
  tenantSlug,
  isLive,
}: {
  tenantSlug: string
  isLive: boolean
}) {
  const [status, setStatus] = useState<ViewerStatus>("idle")
  const [videoStreams, setVideoStreams] = useState<MediaStream[]>([])

  useEffect(() => {
    if (!isLive) {
      setStatus("idle")
      setVideoStreams([])
      return
    }

    let cancelled = false
    let pc: RTCPeerConnection | null = null
    let poll: ReturnType<typeof setInterval> | null = null

    async function join() {
      setStatus("joining")

      const res = await fetch(`/api/public/${tenantSlug}/stream/join`, { method: "POST" }).catch(() => null)
      if (!res?.ok || cancelled) { setStatus("offline"); return }
      const { viewerId } = await res.json()

      setStatus("connecting")

      pc = new RTCPeerConnection(ICE_CONFIG)
      const streamMap = new Map<string, MediaStream>()

      pc.ontrack = ({ streams }) => {
        const stream = streams[0]
        if (!stream || streamMap.has(stream.id)) return
        streamMap.set(stream.id, stream)
        if (!cancelled) setVideoStreams(Array.from(streamMap.values()))
      }

      pc.onconnectionstatechange = () => {
        if (cancelled || !pc) return
        if (pc.connectionState === "connected") setStatus("connected")
        else if (pc.connectionState === "failed" || pc.connectionState === "closed") setStatus("offline")
      }

      // Start polling slightly in the past to avoid missing signals written
      // in the same millisecond as the join response
      let since = new Date(Date.now() - 2000).toISOString()

      poll = setInterval(async () => {
        if (cancelled || !pc) return
        const res = await fetch(
          `/api/public/${tenantSlug}/stream/${viewerId}/signal?since=${encodeURIComponent(since)}`
        ).catch(() => null)
        if (!res?.ok) return
        const sigs = await res.json()
        for (const sig of sigs) {
          const data = JSON.parse(sig.payload)
          if (sig.type === "offer" && pc.signalingState === "stable") {
            await pc.setRemoteDescription({ type: "offer", sdp: data.sdp })
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            // Wait for all ICE candidates embedded before sending answer
            await waitForIceGathering(pc)
            if (cancelled) return
            await fetch(`/api/public/${tenantSlug}/stream/${viewerId}/signal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "answer", payload: JSON.stringify({ sdp: pc.localDescription!.sdp }) }),
            }).catch(() => {})
          }
          since = sig.createdAt
        }
      }, 1_000)
    }

    join()

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
      pc?.close()
      pc = null
      setStatus("idle")
      setVideoStreams([])
    }
  }, [isLive, tenantSlug])

  return { status, videoStreams }
}
