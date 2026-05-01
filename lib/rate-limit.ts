import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL ?? ""
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ""

// Detect placeholder / unconfigured credentials
const redisConfigured =
  url.startsWith("https://") &&
  !url.includes("tuinstancia") &&
  token.length > 20 &&
  token !== "pon_aqui_tu_token_upstash"

const noop = {
  limit: async () => ({
    success: true as const,
    limit: 999,
    remaining: 999,
    reset: 0,
    pending: Promise.resolve(),
    reason: undefined,
  }),
}

function makeRateLimit(limiter: ReturnType<typeof Ratelimit.slidingWindow>, prefix: string) {
  if (!redisConfigured) return noop
  const redis = new Redis({ url, token })
  return new Ratelimit({ redis, limiter, prefix, analytics: true })
}

export const authRateLimit = makeRateLimit(Ratelimit.slidingWindow(5, "15 m"), "rl:auth")
export const apiRateLimit = makeRateLimit(Ratelimit.slidingWindow(100, "1 m"), "rl:api")
export const publicTokenRateLimit = makeRateLimit(Ratelimit.slidingWindow(30, "1 m"), "rl:public-token")

export function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  )
}
