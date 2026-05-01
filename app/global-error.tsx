"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Error crítico</h2>
            <p className="text-sm text-gray-500">{error.message}</p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
