"use client"

import { CameraDevice } from "@/hooks/useCameras"
import { CameraPreview } from "./CameraPreview"

interface Props {
  cameras: CameraDevice[]
  selectedIds: string[]
  maxCameras: number
  onToggle: (deviceId: string) => void
}

export function CameraSelector({ cameras, selectedIds, maxCameras, onToggle }: Props) {
  if (cameras.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p className="font-medium">No se detectaron cámaras</p>
        <p className="text-sm mt-1">Conecta una cámara USB y recarga la página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecciona hasta <strong>{maxCameras}</strong> cámara{maxCameras !== 1 ? "s" : ""} para transmitir.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera) => {
          const selected = selectedIds.includes(camera.deviceId)
          const atLimit = !selected && selectedIds.length >= maxCameras

          return (
            <button
              key={camera.deviceId}
              type="button"
              disabled={atLimit}
              onClick={() => onToggle(camera.deviceId)}
              className={[
                "relative rounded-lg border-2 overflow-hidden text-left transition-all",
                selected
                  ? "border-primary ring-2 ring-primary/20"
                  : atLimit
                    ? "border-muted opacity-50 cursor-not-allowed"
                    : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              <div className="aspect-video bg-muted">
                <CameraPreview deviceId={camera.deviceId} />
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium truncate">{camera.label}</span>
                {selected && (
                  <span className="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 ml-1 shrink-0">
                    Activa
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
