import { NextResponse } from "next/server"
import { z } from "zod"
import { sendContactFormEmail } from "@/lib/email/mailer"
import { getIp, publicTokenRateLimit } from "@/lib/rate-limit"
import { parseBody, rateLimitResponse } from "@/lib/validate"

export const runtime = "nodejs"

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(3000),
})

export async function POST(req: Request) {
  const { success, reset } = await publicTokenRateLimit.limit(getIp(req))
  if (!success) return rateLimitResponse(reset)

  const body = parseBody(ContactSchema, await req.json())
  if (!body.success) return body.response

  const result = await sendContactFormEmail(body.data)

  if (!result.sent) {
    console.error("Contact form email not sent", {
      email: body.data.email,
      error: result.error,
    })

    return NextResponse.json(
      { error: "No hemos podido enviar tu mensaje ahora mismo. Intentalo de nuevo en unos minutos." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
