"use client"

import { useState, useEffect, useCallback } from "react"

export interface CameraDevice {
  deviceId: string
  label: string
}

export interface UseCamerasResult {
  cameras: CameraDevice[]
  selectedIds: string[]
  permissionDenied: boolean
  loading: boolean
  toggleCamera: (deviceId: string, maxCameras: number) => void
}

export function useCameras(): UseCamerasResult {
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function enumerate() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Cámara ${i + 1}`,
          }))
        setCameras(videoDevices)
      } catch {
        setPermissionDenied(true)
      } finally {
        stream?.getTracks().forEach((t) => t.stop())
        setLoading(false)
      }
    }

    enumerate()
  }, [])

  const toggleCamera = useCallback((deviceId: string, maxCameras: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(deviceId)) return prev.filter((id) => id !== deviceId)
      if (prev.length >= maxCameras) return prev
      return [...prev, deviceId]
    })
  }, [])

  return { cameras, selectedIds, permissionDenied, loading, toggleCamera }
}
