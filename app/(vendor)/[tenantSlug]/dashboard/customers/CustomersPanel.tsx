"use client"

import { useState, useEffect, useCallback } from "react"

interface Customer {
  _id: string // phone
  customerName: string
  visits: number
  lastSeen: string
}

interface BlockedEntry {
  _id: string
  phone: string
  reason: string | null
  blockedAt: string
}

interface Props {
  tenantSlug: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "hoy"
  if (days === 1) return "ayer"
  return `hace ${days} días`
}

export function CustomersPanel({ tenantSlug }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [blocked, setBlocked] = useState<BlockedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [blockingPhone, setBlockingPhone] = useState<string | null>(null)
  const [manualPhone, setManualPhone] = useState("")
  const [manualReason, setManualReason] = useState("")
  const [manualLoading, setManualLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/vendor/${tenantSlug}/customers`).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setCustomers(data.customers)
    setBlocked(data.blocked)
    setLoading(false)
  }, [tenantSlug])

  useEffect(() => { fetchData() }, [fetchData])

  const blockedPhones = new Set(blocked.map((b) => b.phone))

  async function blockPhone(phone: string, reason?: string) {
    setBlockingPhone(phone)
    const res = await fetch(`/api/vendor/${tenantSlug}/blocked-phones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, reason: reason ?? null }),
    }).catch(() => null)
    setBlockingPhone(null)
    if (res?.ok) fetchData()
  }

  async function unblockPhone(phone: string) {
    setBlockingPhone(phone)
    const encoded = encodeURIComponent(phone)
    const res = await fetch(`/api/vendor/${tenantSlug}/blocked-phones/${encoded}`, { method: "DELETE" }).catch(() => null)
    setBlockingPhone(null)
    if (res?.ok) fetchData()
  }

  async function handleManualBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!manualPhone.trim()) return
    setManualLoading(true)
    setError(null)
    const res = await fetch(`/api/vendor/${tenantSlug}/blocked-phones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: manualPhone.trim(), reason: manualReason.trim() || null }),
    }).catch(() => null)
    setManualLoading(false)
    if (!res?.ok) { setError("Error al bloquear el número"); return }
    setManualPhone("")
    setManualReason("")
    fetchData()
  }

  return (
    <div className="space-y-8">
      {/* Known customers */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Clientes online conocidos
          </h2>
          <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{customers.length}</span>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        )}

        {!loading && customers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Todavía no hay clientes online registrados.
          </p>
        )}

        {!loading && customers.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-xs font-medium text-muted-foreground px-3 pb-1 border-b">
              <span>Cliente</span>
              <span className="text-right">Visitas</span>
              <span className="text-right">Última vez</span>
              <span />
            </div>
            {customers.map((c) => {
              const isBlocked = blockedPhones.has(c._id)
              return (
                <div
                  key={c._id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-3 py-2.5 rounded-xl transition-colors ${
                    isBlocked ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/40 hover:bg-muted/70"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c._id}</p>
                  </div>
                  <span className="text-sm font-semibold text-right">{c.visits}</span>
                  <span className="text-xs text-muted-foreground text-right whitespace-nowrap">{timeAgo(c.lastSeen)}</span>
                  <div className="flex justify-end">
                    {isBlocked ? (
                      <button
                        onClick={() => unblockPhone(c._id)}
                        disabled={blockingPhone === c._id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Desbloq.
                      </button>
                    ) : (
                      <button
                        onClick={() => blockPhone(c._id)}
                        disabled={blockingPhone === c._id}
                        className="text-xs px-2.5 py-1 rounded-lg border hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        Bloquear
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Blocklist */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lista de bloqueados
        </h2>

        {/* Manual block form */}
        <form onSubmit={handleManualBlock} className="flex gap-2 flex-wrap">
          <input
            type="tel"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className="flex-1 min-w-40 px-3 py-2 rounded-lg border text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          <input
            type="text"
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="flex-1 min-w-40 px-3 py-2 rounded-lg border text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          <button
            type="submit"
            disabled={manualLoading || !manualPhone.trim()}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {manualLoading ? "Bloqueando..." : "Bloquear"}
          </button>
        </form>
        {error && <p className="text-xs text-destructive">{error}</p>}

        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay números bloqueados.
          </p>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => (
              <div
                key={b._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{b.phone}</p>
                  {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(b.blockedAt)}</span>
                <button
                  onClick={() => unblockPhone(b.phone)}
                  disabled={blockingPhone === b.phone}
                  className="text-xs px-2.5 py-1 rounded-lg border hover:bg-background transition-colors disabled:opacity-50"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
