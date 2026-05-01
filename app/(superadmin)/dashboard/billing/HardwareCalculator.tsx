"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type HardwareComponent = {
  name: string
  model: string
  unitCents: number
  perCamera: boolean
  defaultQty: number
  url?: string
}

export type HardwarePlan = {
  id: string
  name: string
  maxCameras: number
  setupFeeCents: number
}

export type Quantities = Record<string, Record<string, number>>

function initQuantities(components: HardwareComponent[], plans: HardwarePlan[]): Quantities {
  const q: Quantities = {}
  for (const c of components) {
    q[c.name] = {}
    for (const p of plans) {
      q[c.name]![p.id] = c.perCamera ? p.maxCameras * c.defaultQty : c.defaultQty
    }
  }
  return q
}

function planKitCost(components: HardwareComponent[], quantities: Quantities, planId: string): number {
  return components.reduce((sum, c) => {
    const qty = quantities[c.name]?.[planId] ?? 0
    return sum + qty * c.unitCents
  }, 0)
}

export function HardwareCalculator({
  components,
  plans,
}: {
  components: HardwareComponent[]
  plans: HardwarePlan[]
}) {
  const [quantities, setQuantities] = useState<Quantities>(() =>
    initQuantities(components, plans)
  )

  function setQty(componentName: string, planId: string, value: number) {
    setQuantities((prev) => ({
      ...prev,
      [componentName]: {
        ...prev[componentName],
        [planId]: Math.max(0, isNaN(value) ? 0 : value),
      },
    }))
  }

  function reset() {
    setQuantities(initQuantities(components, plans))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Presupuesto por componente</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edita las cantidades para calcular el coste de cada kit.
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Restablecer
        </button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Componente</TableHead>
              <TableHead className="min-w-[190px] text-muted-foreground">Modelo</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              {plans.map((p) => (
                <TableHead key={p.id} className="text-center min-w-[110px]">
                  <span className="font-semibold">{p.name}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium align-top pt-3">
                  {c.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground align-top pt-3">
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      {c.model} ↗
                    </a>
                  ) : c.model}
                </TableCell>
                <TableCell className="text-right text-muted-foreground align-top pt-3">
                  {(c.unitCents / 100).toFixed(0)}€
                </TableCell>
                {plans.map((p) => {
                  const qty = quantities[c.name]?.[p.id] ?? 0
                  const subtotal = qty * c.unitCents
                  return (
                    <TableCell key={p.id} className="text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={qty}
                        onChange={(e) => setQty(c.name, p.id, parseInt(e.target.value))}
                        className="w-14 text-center text-sm border rounded-md px-1 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {subtotal > 0 ? `${(subtotal / 100).toFixed(0)}€` : "—"}
                      </p>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}

            {/* Total kit */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={3}>Total kit</TableCell>
              {plans.map((p) => {
                const total = planKitCost(components, quantities, p.id)
                return (
                  <TableCell key={p.id} className="text-center text-orange-600 text-base">
                    {(total / 100).toFixed(0)}€
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Alta cobrada */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={3} className="text-xs text-muted-foreground">
                Alta cobrada al cliente
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} className="text-center text-xs text-muted-foreground">
                  {(p.setupFeeCents / 100).toFixed(0)}€
                </TableCell>
              ))}
            </TableRow>

            {/* Margen por kit */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={3} className="text-xs text-muted-foreground">
                Margen por kit
              </TableCell>
              {plans.map((p) => {
                const kitCost = planKitCost(components, quantities, p.id)
                const margin = p.setupFeeCents - kitCost
                return (
                  <TableCell
                    key={p.id}
                    className={cn(
                      "text-center text-xs font-semibold",
                      margin >= 0 ? "text-green-600" : "text-destructive"
                    )}
                  >
                    {margin >= 0 ? "+" : ""}{(margin / 100).toFixed(0)}€
                  </TableCell>
                )
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
