"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Plan {
  _id: string
  name: string
  priceCents: number
  maxCameras: number
}

interface Billing {
  name: string
  taxId: string
  address: string
  postalCode: string
  city: string
  country: string
}

interface Tenant {
  _id: string
  name: string
  email: string
  slug: string
  customDomain?: string | null
  customDomainStatus?: string
  customDomainVerifiedAt?: string | null
  status: string
  planId: { _id: string; name: string; priceCents: number; maxCameras: number } | null
  planStartedAt: string
  planExpiresAt: string
  billing: Billing
  createdAt: string
}

interface Props {
  tenant: Tenant
  plans: Plan[]
  customDomainTarget: string
}

const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "suspended", label: "Suspendido" },
  { value: "pending", label: "Pendiente" },
]

const STATUS_BADGE: Record<string, "default" | "destructive" | "secondary"> = {
  active: "default",
  suspended: "destructive",
  pending: "secondary",
}

export function TenantEditForm({ tenant, plans, customDomainTarget }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [verifyingDomain, setVerifyingDomain] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domainMessage, setDomainMessage] = useState<string | null>(null)

  // General
  const [name, setName] = useState(tenant.name)
  const [email, setEmail] = useState(tenant.email)
  const [customDomain, setCustomDomain] = useState(tenant.customDomain ?? "")
  const [customDomainStatus, setCustomDomainStatus] = useState(tenant.customDomainStatus ?? "none")
  const [customDomainVerifiedAt, setCustomDomainVerifiedAt] = useState(tenant.customDomainVerifiedAt ?? null)
  const [status, setStatus] = useState(tenant.status)
  const [planId, setPlanId] = useState(tenant.planId?._id ?? "")
  const [planExpiresAt, setPlanExpiresAt] = useState(
    tenant.planExpiresAt ? tenant.planExpiresAt.slice(0, 10) : ""
  )

  // Billing
  const [billingName, setBillingName] = useState(tenant.billing?.name ?? "")
  const [taxId, setTaxId] = useState(tenant.billing?.taxId ?? "")
  const [address, setAddress] = useState(tenant.billing?.address ?? "")
  const [postalCode, setPostalCode] = useState(tenant.billing?.postalCode ?? "")
  const [city, setCity] = useState(tenant.billing?.city ?? "")
  const [country, setCountry] = useState(tenant.billing?.country ?? "")

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          customDomain: customDomain.trim() || null,
          status,
          planId,
          planExpiresAt: planId !== tenant.planId?._id ? undefined : new Date(planExpiresAt).toISOString(),
          billing: { name: billingName, taxId, address, postalCode, city, country },
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
        return
      }
      setSuccess(true)
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  async function handleVerifyDomain() {
    setVerifyingDomain(true)
    setError(null)
    setDomainMessage(null)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant._id}/domain/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: customDomain.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo verificar el dominio")
        return
      }

      setCustomDomain(data.verification.normalizedDomain)
      setCustomDomainStatus(data.verification.status)
      setCustomDomainVerifiedAt(data.verification.verified ? new Date().toISOString() : null)
      setDomainMessage(
        data.verification.verified
          ? `Dominio verificado correctamente. Ya apunta a ${data.verification.expectedTarget}.`
          : data.verification.reason ?? `Aún no apunta a ${data.verification.expectedTarget}.`
      )
      router.refresh()
    } catch {
      setError("Error verificando el dominio")
    } finally {
      setVerifyingDomain(false)
    }
  }

  const planChanged = planId !== (tenant.planId?._id ?? "")
  const domainStatusLabel = {
    none: "Sin configurar",
    pending: "Pendiente",
    active: "Verificado",
    failed: "Con incidencias",
  }[customDomainStatus] ?? customDomainStatus

  const suggestedHost = customDomain.trim() || "www.tudominio.com"
  const apexDomain = suggestedHost.replace(/^www\./, "")

  return (
    <div className="space-y-8 max-w-2xl">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>Cambios guardados correctamente.</AlertDescription></Alert>}

      {/* General */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">General</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre del negocio</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email de acceso</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Slug (solo lectura)</Label>
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
              /{tenant.slug}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Dominio personalizado</h2>
        <div className="space-y-1.5">
          <Label>Dominio público opcional</Label>
          <Input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
            placeholder="www.tudominio.com"
          />
          <p className="text-xs text-muted-foreground">
            Recomendado: crea un CNAME desde el dominio del cliente hacia <strong>{customDomainTarget}</strong>.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configuración DNS recomendada</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <p className="text-muted-foreground">Tipo</p>
            <p className="text-muted-foreground">Host</p>
            <p className="text-muted-foreground">Valor</p>

            <code className="rounded bg-background px-2 py-1">CNAME</code>
            <code className="rounded bg-background px-2 py-1">www</code>
            <code className="rounded bg-background px-2 py-1 break-all">{customDomainTarget}</code>
          </div>
          <p className="text-xs text-muted-foreground">
            Después de guardar, en el DNS del cliente crea ese registro y pulsa <strong>Verificar DNS</strong>. Si usa dominio raíz ({apexDomain}),
            necesitará ALIAS/ANAME o A según su proveedor DNS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={customDomainStatus === "active" ? "default" : customDomainStatus === "failed" ? "destructive" : "secondary"}>
            {domainStatusLabel}
          </Badge>
          {customDomainVerifiedAt && (
            <span className="text-xs text-muted-foreground">
              Verificado el {new Date(customDomainVerifiedAt).toLocaleString("es-ES")}
            </span>
          )}
        </div>

        {domainMessage && (
          <Alert>
            <AlertDescription>{domainMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleVerifyDomain} disabled={verifyingDomain || !customDomain.trim()}>
            {verifyingDomain ? "Verificando…" : "Verificar DNS"}
          </Button>
          {customDomainStatus === "active" && customDomain && (
            <a
              href={`https://${customDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground border rounded-md px-3 py-2 hover:bg-muted transition-colors"
            >
              Abrir dominio ↗
            </a>
          )}
        </div>
      </section>

      {/* Plan */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Plan y suscripción</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Plan actual</Label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {(p.priceCents / 100).toFixed(2)} €/mes · {p.maxCameras} cám.
                </option>
              ))}
            </select>
            {planChanged && (
              <p className="text-xs text-amber-600">Al guardar, la fecha de inicio se resetea a hoy.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Expira el</Label>
            <Input
              type="date"
              value={planExpiresAt}
              onChange={(e) => setPlanExpiresAt(e.target.value)}
              disabled={planChanged}
            />
            {planChanged && (
              <p className="text-xs text-muted-foreground">Se calculará automáticamente (+1 mes).</p>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Plan iniciado: {new Date(tenant.planStartedAt).toLocaleDateString("es-ES")}
        </div>
      </section>

      {/* Billing */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Datos de facturación</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label>Razón social / Nombre</Label>
            <Input value={billingName} onChange={(e) => setBillingName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>NIF / CIF</Label>
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Código postal</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>País</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  )
}
