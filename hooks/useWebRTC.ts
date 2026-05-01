"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type CallType = "audio" | "video"
export type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error"

interface Signal {
  type: "offer" | "answer" | "ice-candidate"
  payload: string
  createdAt: string
}

interface UseWebRTCParams {
  callRoom: string | null
  isInitiator: boolean      // vendor = true, customer = false
  callType: CallType | null // null = don't start yet (customer hasn't chosen)
  sendPath: string | null   // POST path to send signals
  pollPath: string | null   // GET path to poll other party's signals
  onConnected?: () => void
  onEnded?: () => void
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
}

export function useWebRTC({
  callRoom,
  isInitiator,
  callType,
  sendPath,
  pollPath,
  onConnected,
  onEnded,
}: UseWebRTCParams) {
  const [status, setStatus] = useState<CallStatus>("idle")
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const sinceRef = useRef<string>("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopResources = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    pcRef.current?.close()
    pcRef.current = null
  }, [])

  const hangup = useCallback(() => {
    stopResources()
    setStatus("ended")
    onEnded?.()
  }, [stopResources, onEnded])

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setIsMuted(!track.enabled)
  }, [])

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setIsCameraEnabled(track.enabled)
  }, [])

  useEffect(() => {
    if (!callRoom || !callType || !sendPath || !pollPath) return

    let cancelled = false

    // Initiator polls from "now", non-initiator needs to pick up offer sent before accepting
    sinceRef.current = isInitiator
      ? new Date(Date.now() - 60_000).toISOString()
      : new Date(Date.now() - 30 * 60_000).toISOString()

    async function send(type: string, payload: unknown) {
      await fetch(sendPath!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload: JSON.stringify(payload) }),
      }).catch(() => {})
    }

    async function processSignal(pc: RTCPeerConnection, sig: Signal) {
      const data = JSON.parse(sig.payload)
      if (sig.type === "offer") {
        await pc.setRemoteDescription({ type: "offer", sdp: data.sdp })
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        await send("answer", { sdp: answer.sdp })
      } else if (sig.type === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription({ type: "answer", sdp: data.sdp })
        }
      } else if (sig.type === "ice-candidate" && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {})
      }
    }

    async function start() {
      setStatus("connecting")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }

        localStreamRef.current = stream
        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream
        }

        const pc = new RTCPeerConnection(ICE_CONFIG)
        pcRef.current = pc

        // Audio track — always
        stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream))

        if (isInitiator) {
          // Vendor: declare recvonly video so the customer can send theirs
          pc.addTransceiver("video", { direction: "recvonly" })
        } else {
          // Customer: add video track if chosen
          stream.getVideoTracks().forEach((t) => pc.addTrack(t, stream))
        }

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) send("ice-candidate", { candidate: candidate.toJSON() })
        }

        pc.ontrack = ({ track, streams }) => {
          if (remoteVideoRef.current && streams[0]) {
            remoteVideoRef.current.srcObject = streams[0]
          }
          if (track.kind === "video") setHasRemoteVideo(true)
        }

        pc.onconnectionstatechange = () => {
          if (cancelled) return
          const state = pc.connectionState
          if (state === "connected") {
            setStatus("connected")
            onConnected?.()
          } else if (state === "failed" || state === "closed") {
            stopResources()
            setStatus("ended")
            onEnded?.()
          }
        }

        if (isInitiator) {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await send("offer", { sdp: offer.sdp })
        }

        // Poll for signals from the other party
        pollRef.current = setInterval(async () => {
          const res = await fetch(
            `${pollPath}?since=${encodeURIComponent(sinceRef.current)}`
          ).catch(() => null)
          if (!res?.ok || cancelled) return
          const sigs: Signal[] = await res.json()
          for (const sig of sigs) {
            if (pcRef.current) await processSignal(pcRef.current, sig)
            sinceRef.current = sig.createdAt
          }
        }, 800)
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    start()

    return () => {
      cancelled = true
      stopResources()
      setHasRemoteVideo(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callRoom, callType, isInitiator, sendPath, pollPath])

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isCameraEnabled,
    hasRemoteVideo,
    toggleMute,
    toggleCamera,
    hangup,
  }
}
