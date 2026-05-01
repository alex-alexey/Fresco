"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ITenantStore, IProduct } from "@/lib/db/tenant-models"

const DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
] as const

type DayKey = typeof DAYS[number]["key"]

interface Props {
  tenantSlug: string
  store: ITenantStore
}

export function SettingsForm({ tenantSlug, store }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // General
  const [name, setName] = useState(store.name ?? "")
  const [description, setDescription] = useState(store.description ?? "")
  const [logoUrl, setLogoUrl] = useState(store.logoUrl ?? "")

  // Theme
  const [primaryColor, setPrimaryColor] = useState(store.theme?.primaryColor ?? "#22c55e")

  // Social
  const [instagram, setInstagram] = useState(store.social?.instagram ?? "")
  const [facebook, setFacebook] = useState(store.social?.facebook ?? "")
  const [tiktok, setTiktok] = useState(store.social?.tiktok ?? "")

  // Contact
  const [phone, setPhone] = useState(store.contact?.phone ?? "")
  const [email, setEmail] = useState(store.contact?.email ?? "")
  const [address, setAddress] = useState(store.contact?.address ?? "")

  // Schedule
  const defaultDay = { open: "09:00", close: "14:00", closed: false }
  const [schedule, setSchedule] = useState({
    mon: store.schedule?.mon ?? defaultDay,
    tue: store.schedule?.tue ?? defaultDay,
    wed: store.schedule?.wed ?? defaultDay,
    thu: store.schedule?.thu ?? defaultDay,
    fri: store.schedule?.fri ?? defaultDay,
    sat: store.schedule?.sat ?? { open: "09:00", close: "13:00", closed: false },
  })

  // Products
  const [products, setProducts] = useState<IProduct[]>(store.products ?? [])
  const [newProductName, setNewProductName] = useState("")
  const [newProductDesc, setNewProductDesc] = useState("")
  const [newProductImage, setNewProductImage] = useState("")
  const [addingProduct, setAddingProduct] = useState(false)

  function updateDay(day: DayKey, field: "open" | "close" | "closed", value: string | boolean) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/vendor/${tenantSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          logoUrl: logoUrl || null,
          theme: { primaryColor },
          social: {
            instagram: instagram || null,
            facebook: facebook || null,
            tiktok: tiktok || null,
          },
          contact: {
            phone: phone || null,
            email: email || null,
            address: address || null,
          },
          schedule,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        console.error("Settings save error:", d)
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

  async function handleAddProduct() {
    if (!newProductName.trim()) return
    setAddingProduct(true)
    try {
      const res = await fetch(`/api/vendor/${tenantSlug}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName,
          description: newProductDesc,
          imageUrl: newProductImage || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.product) {
        setProducts((prev) => [...prev, data.product])
        setNewProductName("")
        setNewProductDesc("")
        setNewProductImage("")
      }
    } finally {
      setAddingProduct(false)
    }
  }

  async function handleDeleteProduct(productId: string) {
    await fetch(`/api/vendor/${tenantSlug}/products/${productId}`, { method: "DELETE" })
    setProducts((prev) => prev.filter((p) => p._id.toString() !== productId))
  }

  return (
    <div className="space-y-10 max-w-2xl">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>Cambios guardados correctamente.</AlertDescription></Alert>}

      {/* General */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">General</h2>
        <div className="space-y-1.5">
          <Label>Nombre de la tienda</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 rounded-md border border-input text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">{description.length}/500</p>
        </div>
        <div className="space-y-1.5">
          <Label>URL del logo</Label>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          {logoUrl && <img src={logoUrl} alt="Logo preview" className="h-12 rounded object-contain mt-1" />}
        </div>
      </section>

      {/* Apariencia */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Apariencia</h2>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <Label>Color principal</Label>
            <p className="text-xs text-muted-foreground">Controla botones, acentos y el badge "En directo"</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer"
            />
            <span className="text-sm font-mono">{primaryColor}</span>
          </div>
        </div>
      </section>

      {/* Horario */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Horario</h2>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm w-20 flex-shrink-0">{label}</span>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={schedule[key].closed}
                  onChange={(e) => updateDay(key, "closed", e.target.checked)}
                  className="rounded"
                />
                Cerrado
              </label>
              {!schedule[key].closed && (
                <>
                  <Input
                    type="time"
                    value={schedule[key].open}
                    onChange={(e) => updateDay(key, "open", e.target.value)}
                    className="w-32 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={schedule[key].close}
                    onChange={(e) => updateDay(key, "close", e.target.value)}
                    className="w-32 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Redes sociales */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Redes sociales</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm w-24 flex-shrink-0">Instagram</span>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tu_tienda" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm w-24 flex-shrink-0">Facebook</span>
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="tu.pagina" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm w-24 flex-shrink-0">TikTok</span>
            <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@tu_tienda" />
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Contacto</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tienda@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle Mayor, 1 — Madrid" />
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>

      {/* Productos */}
      <section className="space-y-4 border-t pt-10">
        <h2 className="text-lg font-semibold border-b pb-2">Productos destacados</h2>

        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id.toString()} className="flex items-start gap-3 p-3 rounded-lg border">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
              </div>
              <button
                onClick={() => handleDeleteProduct(p._id.toString())}
                className="text-destructive hover:text-destructive/80 text-xs flex-shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <p className="text-sm font-medium">Añadir producto</p>
          <div className="space-y-2">
            <Input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Nombre del producto *"
            />
            <textarea
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              rows={2}
              placeholder="Descripción (opcional)"
              className="w-full px-3 py-2 rounded-md border border-input text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
            />
            <Input
              value={newProductImage}
              onChange={(e) => setNewProductImage(e.target.value)}
              placeholder="URL de la imagen (opcional)"
            />
          </div>
          <Button
            onClick={handleAddProduct}
            disabled={addingProduct || !newProductName.trim()}
            size="sm"
            variant="outline"
          >
            {addingProduct ? "Añadiendo…" : "Añadir producto"}
          </Button>
        </div>
      </section>
    </div>
  )
}
