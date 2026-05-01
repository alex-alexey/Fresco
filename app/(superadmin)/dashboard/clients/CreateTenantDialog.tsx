"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Copy, Check } from "lucide-react"

type Plan = { _id: string; name: string; priceCents: number; maxCameras: number }

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)
}

type CredentialsResult = { tempPassword: string; slug: string; email: string }

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-muted px-3 py-2 rounded text-xs break-all">{value}</code>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copy}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  )
}

export function CreateTenantDialog({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [planId, setPlanId] = useState("")
  const [slug, setSlug] = useState("")
  const [billingName, setBillingName] = useState("")
  const [billingTaxId, setBillingTaxId] = useState("")
  const [billingAddress, setBillingAddress] = useState("")
  const [billingPostalCode, setBillingPostalCode] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingCountry, setBillingCountry] = useState("España")

  function handleNameChange(value: string) {
    setName(value)
    setSlug(toSlug(value))
  }

  function reset() {
    setName(""); setEmail(""); setPlanId(""); setSlug("")
    setBillingName(""); setBillingTaxId(""); setBillingAddress("")
    setBillingPostalCode(""); setBillingCity(""); setBillingCountry("España")
    setError(null); setCredentials(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    setOpen(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, planId, slug,
          billing: {
            name: billingName, taxId: billingTaxId, address: billingAddress,
            postalCode: billingPostalCode, city: billingCity, country: billingCountry,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al crear el cliente"); return }
      setCredentials({ tempPassword: data.tempPassword, slug, email })
      router.refresh()
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const canSubmit = !loading && !!planId && !!slug && !!billingName && !!billingTaxId && !!billingAddress && !!billingPostalCode && !!billingCity

  return (
    <>
      <Button onClick={() => setOpen(true)}>Nuevo cliente</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
          {credentials ? (
            <>
              <DialogHeader>
                <DialogTitle>Cliente creado</DialogTitle>
                <DialogDescription>
                  Copia las credenciales antes de cerrar. La contraseña no se volverá a mostrar.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <CopyField label="URL de acceso" value={`${appUrl}/${credentials.slug}/login`} />
                <CopyField label="Email" value={credentials.email} />
                <CopyField label="Contraseña temporal" value={credentials.tempPassword} />
                <Alert>
                  <AlertDescription className="text-xs">
                    El cliente debe cambiar esta contraseña en su primer acceso.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Nuevo cliente</DialogTitle>
                <DialogDescription>
                  Se provisionará su base de datos y se generarán credenciales de acceso automáticamente.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-2">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Sección: datos del negocio */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Datos del negocio
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nombre del negocio</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Pescadería El Faro"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="slug">Slug (URL pública)</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-sm shrink-0">/</span>
                        <Input
                          id="slug"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="pescaderia-el-faro"
                          required
                          disabled={loading}
                          className="font-mono text-sm"
                        />
                      </div>
                      {slug && (
                        <p className="text-xs text-muted-foreground truncate">{appUrl}/{slug}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email del vendedor</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vendedor@pescaderiaelfaro.com"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Plan</Label>
                      <Select value={planId} onValueChange={(v) => setPlanId(v ?? "")} disabled={loading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name} — {p.maxCameras} cám · {(p.priceCents / 100).toFixed(0)}€/mes
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Sección: facturación */}
                <div className="space-y-4 border-t pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Datos de facturación
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="billingName">Nombre fiscal</Label>
                      <Input
                        id="billingName"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        placeholder="Pescadería El Faro S.L."
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="billingTaxId">CIF / NIF</Label>
                      <Input
                        id="billingTaxId"
                        value={billingTaxId}
                        onChange={(e) => setBillingTaxId(e.target.value.toUpperCase())}
                        placeholder="B12345678"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billingAddress">Dirección</Label>
                    <Input
                      id="billingAddress"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Calle del Mar, 12"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="billingPostalCode">Código postal</Label>
                      <Input
                        id="billingPostalCode"
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        placeholder="08001"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingCity">Ciudad</Label>
                      <Input
                        id="billingCity"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="Barcelona"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="billingCountry">País</Label>
                      <Input
                        id="billingCountry"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        placeholder="España"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {loading ? "Creando…" : "Crear cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
