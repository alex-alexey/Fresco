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

async function sendEmail(to: string, template: EmailTemplate): Promise<EmailSendResult> {
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
