"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline">Reintentar</Button>
      </div>
    </div>
  )
}
