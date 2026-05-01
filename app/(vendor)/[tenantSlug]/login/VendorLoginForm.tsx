"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email o contraseña incorrectos.",
  TooManyRequests: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.",
}

export function VendorLoginForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await signIn("vendor-credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      tenantSlug,
      redirect: false,
    })

    setLoading(false)

    if (!result || result.error) {
      setError(ERROR_MESSAGES[result?.error ?? ""] ?? "Error al iniciar sesión.")
      return
    }

    router.push(`/${tenantSlug}/dashboard`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? "Accediendo…" : "Acceder"}
      </Button>
    </form>
  )
}
