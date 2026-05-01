import nodemailer from "nodemailer"
import { env } from "@/lib/env"
import {
  buildAccountReactivatedEmail,
  buildAccountSuspendedEmail,
  buildInvoiceAvailableEmail,
  buildPasswordResetEmail,
  buildPaymentConfirmedEmail,
  buildTenantWelcomeEmail,
  type AccountReactivatedEmailInput,
  type AccountSuspendedEmailInput,
  type EmailTemplate,
  type InvoiceAvailableEmailInput,
  type PasswordResetEmailInput,
  type PaymentConfirmedEmailInput,
  type WelcomeEmailInput,
} from "@/lib/email/templates"

interface EmailSendResult {
  sent: boolean
  error?: string
}

interface ContactFormEmailInput {
  name: string
  email: string
  message: string
}

interface SendEmailOptions {
  replyTo?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function smtpConfig() {
  const host = env.SMTP_HOST
  const port = env.SMTP_PORT
  const user = env.SMTP_USER
  const pass = env.SMTP_PASS
  const fromEmail = env.SMTP_FROM_EMAIL
  const fromName = env.SMTP_FROM_NAME ?? "FrescoEnVivo"

  if (!host || !port || !user || !pass || !fromEmail) {
    return null
  }

  return {
    host,
    port,
    user,
    pass,
    fromEmail,
    fromName,
  }
}

export async function sendTenantWelcomeEmail(input: WelcomeEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildTenantWelcomeEmail(input))
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildPasswordResetEmail(input))
}

export async function sendPaymentConfirmedEmail(input: PaymentConfirmedEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildPaymentConfirmedEmail(input))
}

export async function sendInvoiceAvailableEmail(input: InvoiceAvailableEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildInvoiceAvailableEmail(input))
}

export async function sendAccountSuspendedEmail(input: AccountSuspendedEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildAccountSuspendedEmail(input))
}

export async function sendAccountReactivatedEmail(input: AccountReactivatedEmailInput): Promise<EmailSendResult> {
  return sendEmail(input.to, buildAccountReactivatedEmail(input))
}

export async function sendContactFormEmail(input: ContactFormEmailInput): Promise<EmailSendResult> {
  const destination = env.CONTACT_FORM_TO_EMAIL ?? env.SMTP_FROM_EMAIL

  if (!destination) {
    return {
      sent: false,
      error: "Falta configurar CONTACT_FORM_TO_EMAIL o SMTP_FROM_EMAIL.",
    }
  }

  const safeName = escapeHtml(input.name)
  const safeEmail = escapeHtml(input.email)
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />")

  return sendEmail(
    destination,
    {
      subject: `Nuevo mensaje de contacto de ${input.name}`,
      text: [
        "Nuevo mensaje de contacto recibido:",
        `Nombre: ${input.name}`,
        `Email: ${input.email}`,
        "",
        "Mensaje:",
        input.message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;">
          <h2 style="margin:0 0 12px;">Nuevo mensaje de contacto</h2>
          <p style="margin:0 0 6px;"><strong>Nombre:</strong> ${safeName}</p>
          <p style="margin:0 0 6px;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin:12px 0 6px;"><strong>Mensaje:</strong></p>
          <p style="margin:0;white-space:normal;">${safeMessage}</p>
        </div>
      `,
    },
    {
      replyTo: `${input.name} <${input.email}>`,
    }
  )
}

async function sendEmail(to: string, template: EmailTemplate, options?: SendEmailOptions): Promise<EmailSendResult> {
  const config = smtpConfig()

  if (!config) {
    return {
      sent: false,
      error: "SMTP no configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM_EMAIL.",
    }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  try {
    await transporter.sendMail({
      from: `${config.fromName} <${config.fromEmail}>`,
      to,
      replyTo: options?.replyTo,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Error desconocido al enviar email",
    }
  }
}
