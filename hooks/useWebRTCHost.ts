"use client"

import { useEffect, useRef, useState } from "react"

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
}

interface ViewerConn {
  pc: RTCPeerConnection
  poll: ReturnType<typeof setInterval>
}

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

export function useWebRTCHost({
  isLive,
  streams,
  tenantSlug,
}: {
  isLive: boolean
  streams: MediaStream[]
  tenantSlug: string
}) {
  const [viewerCount, setViewerCount] = useState(0)

  const streamsRef = useRef<MediaStream[]>([])
  streamsRef.current = streams

  useEffect(() => {
    if (!isLive || streams.length === 0) return

    const viewers = new Map<string, ViewerConn>()
    const pendingViewers = new Set<string>()
    let viewersSince = new Date(Date.now() - 5_000).toISOString()
    let cancelled = false

    async function send(viewerId: string, type: string, payload: unknown) {
      await fetch(`/api/vendor/${tenantSlug}/stream/viewers/${viewerId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload: JSON.stringify(payload) }),
      }).catch(() => {})
    }

    async function connectViewer(viewerId: string) {
      if (viewers.has(viewerId) || pendingViewers.has(viewerId) || cancelled) return
      pendingViewers.add(viewerId)

      const pc = new RTCPeerConnection(ICE_CONFIG)

      for (const stream of streamsRef.current) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream)
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          const v = viewers.get(viewerId)
          if (v) { clearInterval(v.poll); pc.close(); viewers.delete(viewerId) }
          if (!cancelled) setViewerCount(viewers.size)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      // Wait for all ICE candidates to be embedded in the SDP before sending
      await waitForIceGathering(pc)
      if (cancelled) { pc.close(); return }

      await send(viewerId, "offer", { sdp: pc.localDescription!.sdp })

      let signalSince = new Date().toISOString()

      const poll = setInterval(async () => {
        if (cancelled) return
        const res = await fetch(
          `/api/vendor/${tenantSlug}/stream/viewers/${viewerId}/signal?since=${encodeURIComponent(signalSince)}`
        ).catch(() => null)
        if (!res?.ok) return
        const sigs = await res.json()
        for (const sig of sigs) {
          const data = JSON.parse(sig.payload)
          if (sig.type === "answer" && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription({ type: "answer", sdp: data.sdp }).catch(() => {})
          }
          signalSince = sig.createdAt
        }
      }, 800)

      viewers.set(viewerId, { pc, poll })
      pendingViewers.delete(viewerId)
      if (!cancelled) setViewerCount(viewers.size)
    }

    const viewerPoll = setInterval(async () => {
      if (cancelled) return
      const res = await fetch(
        `/api/vendor/${tenantSlug}/stream/viewers?since=${encodeURIComponent(viewersSince)}`
      ).catch(() => null)
      if (!res?.ok) return
      const newViewers: Array<{ viewerId: string; createdAt: string }> = await res.json()
      for (const v of newViewers) {
        viewersSince = v.createdAt
        connectViewer(v.viewerId).catch(() => {})
      }
    }, 2_000)

    return () => {
      cancelled = true
      clearInterval(viewerPoll)
      for (const { pc, poll } of viewers.values()) {
        clearInterval(poll)
        pc.close()
      }
      viewers.clear()
      setViewerCount(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, streams.length, tenantSlug])

  return { viewerCount }
}
