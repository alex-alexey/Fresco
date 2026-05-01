import { z, ZodSchema } from "zod"
import { NextResponse } from "next/server"

export function parseBody<T>(schema: ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}

export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    }
  )
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}
