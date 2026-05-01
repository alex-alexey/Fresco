import dns from "node:dns/promises"
import { env } from "@/lib/env"
import { Tenant, type ITenant } from "@/lib/db/models/Tenant"

export interface DomainVerificationResult {
  verified: boolean
  normalizedDomain: string
  expectedTarget: string
  status: "active" | "pending" | "failed"
  foundRecords: string[]
  reason?: string
}

export function normalizeHost(input: string | null | undefined): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
}

export function normalizeDomainInput(input: string): string {
  const normalized = normalizeHost(input)

  if (!normalized || normalized.includes(" ") || normalized.includes("..")) {
    throw new Error("Dominio inválido")
  }

  if (!/^[a-z0-9.-]+$/.test(normalized) || !normalized.includes(".")) {
    throw new Error("El dominio debe ser un host válido")
  }

  return normalized
}

export function getAppHost(): string {
  return normalizeHost(new URL(env.NEXT_PUBLIC_APP_URL).host)
}

export function getExpectedCustomDomainTarget(): string {
  return normalizeHost(env.CUSTOM_DOMAIN_TARGET ?? getAppHost())
}

export function isPrimaryAppHost(host: string): boolean {
  const normalized = normalizeHost(host)
  const appHost = getAppHost()

  return normalized === appHost || normalized === "localhost" || normalized.startsWith("127.0.0.1")
}

export async function resolveTenantFromHost(host: string): Promise<ITenant | null> {
  const normalizedHost = normalizeHost(host)
  if (!normalizedHost || isPrimaryAppHost(normalizedHost)) return null

  return Tenant.findOne({
    customDomain: normalizedHost,
    customDomainStatus: "active",
    status: "active",
  }).lean()
}

export async function verifyCustomDomain(inputDomain: string): Promise<DomainVerificationResult> {
  const normalizedDomain = normalizeDomainInput(inputDomain)
  const expectedTarget = getExpectedCustomDomainTarget()

  let cnameRecords: string[] = []
  let domainARecords: string[] = []
  let targetARecords: string[] = []

  try {
    cnameRecords = (await dns.resolveCname(normalizedDomain)).map((record) => normalizeHost(record))
  } catch {}

  try {
    domainARecords = (await dns.resolve4(normalizedDomain)).map((record) => record.trim())
  } catch {}

  try {
    targetARecords = (await dns.resolve4(expectedTarget)).map((record) => record.trim())
  } catch {}

  const foundRecords = [...cnameRecords, ...domainARecords]
  const cnameMatch = cnameRecords.includes(expectedTarget)
  const ipMatch = domainARecords.some((record) => targetARecords.includes(record))

  if (cnameMatch || ipMatch) {
    return {
      verified: true,
      normalizedDomain,
      expectedTarget,
      status: "active",
      foundRecords,
    }
  }

  return {
    verified: false,
    normalizedDomain,
    expectedTarget,
    status: foundRecords.length > 0 ? "failed" : "pending",
    foundRecords,
    reason: foundRecords.length > 0
      ? `El dominio no apunta al destino esperado (${expectedTarget}).`
      : `No se han encontrado registros DNS resolviendo hacia ${expectedTarget}.`,
  }
}