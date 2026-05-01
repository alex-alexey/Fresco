"use client"

import { useEffect, useRef } from "react"

interface Props {
  deviceId: string
}

export function CameraPreview({ deviceId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        // Preview unavailable for this camera
      }
    }

    start()

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [deviceId])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover rounded"
    />
  )
}
