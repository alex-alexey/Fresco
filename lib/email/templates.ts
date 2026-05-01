import { env } from "@/lib/env"

export interface EmailTemplate {
  subject: string
  text: string
  html: string
}

interface TemplateLink {
  label: string
  url: string
}

interface TemplateDetail {
  label: string
  value: string
  href?: string
}

interface TemplateOptions {
  subject: string
  preheader: string
  badge: string
  title: string
  intro: string
  detailsTitle: string
  details: TemplateDetail[]
  action?: TemplateLink
  secondaryAction?: TemplateLink
  steps?: string[]
  stepsTitle?: string
  note?: string
  accent?: "green" | "amber" | "red" | "blue"
}

export interface WelcomeEmailInput {
  to: string
  tenantName: string
  tenantSlug: string
  password: string
  loginUrl: string
}

export interface PasswordResetEmailInput {
  to: string
  tenantName: string
  resetUrl: string
  expiresInMinutes: number
}

export interface PaymentConfirmedEmailInput {
  to: string
  tenantName: string
  amount: string
  planName: string
  billingPeriod: string
  invoiceNumber?: string
  manageBillingUrl: string
}

export interface InvoiceAvailableEmailInput {
  to: string
  tenantName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  invoiceUrl: string
}

export interface AccountSuspendedEmailInput {
  to: string
  tenantName: string
  reason: string
  reactivationUrl: string
}

export interface AccountReactivatedEmailInput {
  to: string
  tenantName: string
  planName: string
  dashboardUrl: string
  nextBillingDate?: string
}

const ACCENT_STYLES = {
  green: {
    soft: "#dcfce7",
    strong: "#22c55e",
    ink: "#15803d",
    glow: "rgba(34, 197, 94, 0.18)",
    badge: "#16a34a",
  },
  amber: {
    soft: "#fef3c7",
    strong: "#f59e0b",
    ink: "#b45309",
    glow: "rgba(245, 158, 11, 0.18)",
    badge: "#d97706",
  },
  red: {
    soft: "#fee2e2",
    strong: "#ef4444",
    ink: "#b91c1c",
    glow: "rgba(239, 68, 68, 0.16)",
    badge: "#dc2626",
  },
  blue: {
    soft: "#dbeafe",
    strong: "#3b82f6",
    ink: "#1d4ed8",
    glow: "rgba(59, 130, 246, 0.16)",
    badge: "#2563eb",
  },
} as const

function getBrandConfig() {
  const companyName = env.SMTP_FROM_NAME ?? "FrescoEnVivo"
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  const supportEmail = env.SMTP_FROM_EMAIL ?? "soporte@frescoenvivo.com"
  const supportUrl = env.BRAND_SUPPORT_URL ?? `mailto:${supportEmail}`
  const instagramUrl = env.BRAND_INSTAGRAM_URL ?? `${appUrl}/#contacto`
  const logoUrl = env.BRAND_LOGO_URL

  return {
    companyName,
    appUrl,
    supportEmail,
    supportUrl,
    instagramUrl,
    logoUrl,
  }
}

function renderBrandMark(companyName: string, logoUrl?: string): string {
  if (logoUrl) {
    return `
      <table role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle; padding-right:12px;">
            <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" style="display:block; width:42px; height:42px; border-radius:12px; object-fit:cover;" />
          </td>
          <td style="vertical-align:middle; font-size:22px; font-weight:700; color:#111827; letter-spacing:-0.02em;">
            ${escapeHtml(companyName)}
          </td>
        </tr>
      </table>
    `
  }

  return `
    <div style="display:inline-flex; align-items:center; gap:10px;">
      <span style="display:inline-block; width:38px; height:38px; border-radius:12px; background:#22c55e; text-align:center; line-height:38px; font-size:20px; color:#ffffff; font-weight:700;">•</span>
      <span style="font-size:22px; font-weight:700; color:#111827; letter-spacing:-0.02em;">${escapeHtml(companyName)}</span>
    </div>
  `
}

function buildBrandedEmail(options: TemplateOptions): EmailTemplate {
  const brand = getBrandConfig()
  const accent = ACCENT_STYLES[options.accent ?? "green"]
  const steps = options.steps ?? []
  const subject = options.subject

  const detailRows = options.details
    .map((detail) => {
      const value = detail.href
        ? `<a href="${escapeHtml(detail.href)}" style="color:${accent.badge}; text-decoration:none; font-weight:700;">${escapeHtml(detail.value)}</a>`
        : `<span style="color:#111827; font-weight:700;">${escapeHtml(detail.value)}</span>`

      return `
        <tr>
          <td style="padding:0 0 14px; font-size:13px; color:#6b7280; width:160px;">${escapeHtml(detail.label)}</td>
          <td style="padding:0 0 14px; font-size:14px; color:#111827;">${value}</td>
        </tr>
      `
    })
    .join("")

  const htmlSteps = steps.length
    ? `
      <div style="margin-top:22px; background:#f9fafb; border:1px solid #eef2f7; border-radius:22px; padding:22px;">
        <h2 style="margin:0 0 14px; font-size:18px; color:#111827;">${escapeHtml(options.stepsTitle ?? "Siguientes pasos")}</h2>
        <ol style="margin:0; padding-left:20px; color:#4b5563; font-size:15px; line-height:1.8;">
          ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    `
    : ""

  const actions = [options.action, options.secondaryAction].filter(Boolean) as TemplateLink[]
  const htmlActions = actions.length
    ? `
      <div style="padding:24px 0 0; text-align:center;">
        ${actions
          .map((action, index) => {
            const isPrimary = index === 0
            return `<a href="${escapeHtml(action.url)}" style="display:inline-block; ${
              isPrimary
                ? `background:${accent.strong}; color:#ffffff; box-shadow:0 12px 24px ${accent.glow};`
                : "background:#ffffff; color:#111827; border:1px solid #d1d5db;"
            } text-decoration:none; padding:15px 26px; border-radius:999px; font-size:14px; font-weight:700; margin:0 6px 10px;">${escapeHtml(action.label)}</a>`
          })
          .join("")}
      </div>
    `
    : ""

  const footerLinks = [
    { label: "Web", url: brand.appUrl },
    { label: "Soporte", url: brand.supportUrl },
    { label: "Instagram", url: brand.instagramUrl },
  ]

  const html = `
    <div style="margin:0; padding:32px 16px; background:#f7faf7; font-family:Arial, Helvetica, sans-serif; color:#111827;">
      <span style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden;">${escapeHtml(options.preheader)}</span>
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:28px; overflow:hidden; box-shadow:0 24px 60px ${accent.glow};">
        <div style="padding:28px 32px 16px; background:linear-gradient(180deg, #effdf3 0%, #ffffff 100%); border-bottom:1px solid #ecfdf3;">
          <table role="presentation" style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">${renderBrandMark(brand.companyName, brand.logoUrl)}</td>
              <td style="text-align:right; vertical-align:middle;">
                <span style="display:inline-block; padding:8px 12px; border-radius:999px; background:${accent.soft}; color:${accent.ink}; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">${escapeHtml(options.badge)}</span>
              </td>
            </tr>
          </table>

          <h1 style="margin:22px 0 10px; font-size:34px; line-height:1.08; font-weight:700; color:#111827; letter-spacing:-0.03em;">${escapeHtml(options.title)}</h1>
          <p style="margin:0; max-width:560px; font-size:16px; line-height:1.7; color:#4b5563;">${escapeHtml(options.intro)}</p>
        </div>

        <div style="padding:28px 32px 8px;">
          <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:22px; overflow:hidden;">
            <div style="padding:12px 16px; background:#f9fafb; border-bottom:1px solid #f3f4f6;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:999px; background:#f87171; margin-right:6px;"></span>
              <span style="display:inline-block; width:10px; height:10px; border-radius:999px; background:#fbbf24; margin-right:6px;"></span>
              <span style="display:inline-block; width:10px; height:10px; border-radius:999px; background:#22c55e;"></span>
              <span style="display:inline-block; margin-left:12px; font-size:12px; color:#9ca3af; vertical-align:middle;">${escapeHtml(brand.appUrl)}</span>
            </div>

            <div style="padding:24px; background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
              <div style="background:#ffffff; border:1px solid ${accent.soft}; border-radius:18px; padding:20px;">
                <p style="margin:0 0 18px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${accent.ink};">${escapeHtml(options.detailsTitle)}</p>
                <table role="presentation" style="width:100%; border-collapse:collapse;">
                  ${detailRows}
                </table>
              </div>
              ${htmlActions}
            </div>
          </div>
          ${htmlSteps}
        </div>

        <div style="padding:20px 32px 32px; border-top:1px solid #f3f4f6; color:#6b7280; font-size:13px; line-height:1.7; background:#ffffff;">
          ${options.note ? `<p style="margin:0 0 10px;">${escapeHtml(options.note)}</p>` : ""}
          <p style="margin:0 0 12px;">Si necesitas ayuda con tu tienda o tu cuenta, puedes escribirnos directamente a <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${accent.badge}; text-decoration:none; font-weight:700;">${escapeHtml(brand.supportEmail)}</a>.</p>
          <p style="margin:0;">
            ${footerLinks
              .map((link, index) => `${index > 0 ? "&nbsp;&nbsp;•&nbsp;&nbsp;" : ""}<a href="${escapeHtml(link.url)}" style="color:${accent.badge}; text-decoration:none; font-weight:700;">${escapeHtml(link.label)}</a>`)
              .join("")}
          </p>
        </div>
      </div>
    </div>
  `

  const textLines = [
    options.title,
    "",
    options.intro,
    "",
    `${options.detailsTitle}:`,
    ...options.details.map((detail) => `- ${detail.label}: ${detail.value}`),
    ...(options.action ? ["", `${options.action.label}: ${options.action.url}`] : []),
    ...(options.secondaryAction ? [`${options.secondaryAction.label}: ${options.secondaryAction.url}`] : []),
    ...(steps.length ? ["", `${options.stepsTitle ?? "Siguientes pasos"}:`, ...steps.map((step, index) => `${index + 1}. ${step}`)] : []),
    ...(options.note ? ["", options.note] : []),
    "",
    `Soporte: ${brand.supportEmail}`,
    `Web: ${brand.appUrl}`,
    `Instagram: ${brand.instagramUrl}`,
    "",
    brand.companyName,
  ]

  return {
    subject,
    text: textLines.join("\n"),
    html,
  }
}

export function buildTenantWelcomeEmail(input: WelcomeEmailInput): EmailTemplate {
  const dashboardUrl = input.loginUrl.replace(/\/login\/?$/, "/dashboard")
  const domainTarget = env.CUSTOM_DOMAIN_TARGET ?? new URL(env.NEXT_PUBLIC_APP_URL).host

  return buildBrandedEmail({
    subject: `Bienvenido a FrescoEnVivo, ${input.tenantName}`,
    preheader: `Tu tienda ${input.tenantName} ya tiene acceso inicial listo.`,
    badge: "En directo",
    title: "Tu tienda ya esta lista para vender fresco y en directo",
    intro: `Hola ${input.tenantName}, ya tienes preparado tu acceso inicial para empezar a configurar tu escaparate, mostrar tus productos del dia y atender a tus clientes desde tu tienda online.`,
    detailsTitle: "Credenciales de acceso",
    details: [
      { label: "URL de acceso", value: input.loginUrl, href: input.loginUrl },
      { label: "Email", value: input.to },
      { label: "Contrasena temporal", value: input.password },
      { label: "Slug de tienda", value: input.tenantSlug },
    ],
    action: { label: "Entrar a mi cuenta", url: input.loginUrl },
    secondaryAction: { label: "Abrir panel", url: dashboardUrl },
    steps: [
      "Inicia sesion con tus credenciales temporales.",
      "Cambia la contrasena en tu primer acceso.",
      "Configura la informacion de tu tienda, productos y horarios.",
      `Si quieres usar tu propio dominio, podras apuntarlo por DNS a ${domainTarget} y activarlo despues desde soporte o configuracion.`,
    ],
    note: "Este correo contiene credenciales temporales generadas para el alta inicial de tu cuenta. La URL por slug funciona desde el primer minuto; el dominio propio es un paso opcional posterior.",
    accent: "green",
  })
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): EmailTemplate {
  return buildBrandedEmail({
    subject: `Restablece tu acceso a FrescoEnVivo`,
    preheader: `Hemos generado un enlace seguro para restablecer la contrasena de ${input.tenantName}.`,
    badge: "Seguridad",
    title: "Restablece tu contrasena de acceso",
    intro: `Hemos recibido una solicitud para cambiar la contrasena de la cuenta de ${input.tenantName}. Usa el siguiente enlace seguro para definir una nueva contrasena.`,
    detailsTitle: "Datos de la solicitud",
    details: [
      { label: "Cuenta", value: input.to },
      { label: "Tienda", value: input.tenantName },
      { label: "Validez del enlace", value: `${input.expiresInMinutes} minutos` },
    ],
    action: { label: "Cambiar contrasena", url: input.resetUrl },
    steps: [
      "Abre el enlace seguro desde el mismo dispositivo donde has solicitado el cambio.",
      "Elige una contrasena unica y facil de recordar para tu equipo.",
      "Si no has pedido este cambio, ignora este correo y avisanos.",
    ],
    note: "Por seguridad, este enlace caduca automaticamente y solo debe usarse una vez.",
    accent: "blue",
  })
}

export function buildPaymentConfirmedEmail(input: PaymentConfirmedEmailInput): EmailTemplate {
  return buildBrandedEmail({
    subject: `Pago confirmado de tu plan ${input.planName}`,
    preheader: `Hemos confirmado el pago de ${input.amount} para la cuenta de ${input.tenantName}.`,
    badge: "Facturacion",
    title: "Tu pago se ha confirmado correctamente",
    intro: `Hemos recibido el cobro de tu plan ${input.planName}. Tu cuenta sigue activa y lista para que sigas vendiendo en directo sin interrupciones.`,
    detailsTitle: "Resumen del pago",
    details: [
      { label: "Tienda", value: input.tenantName },
      { label: "Plan", value: input.planName },
      { label: "Importe", value: input.amount },
      { label: "Periodo", value: input.billingPeriod },
      ...(input.invoiceNumber ? [{ label: "Factura", value: input.invoiceNumber }] : []),
    ],
    action: { label: "Ver facturacion", url: input.manageBillingUrl },
    steps: [
      "Guarda la factura en tu contabilidad si la necesitas.",
      "Revisa tu plan actual y las capacidades activas de tu cuenta.",
      "Si gestionas varios negocios, confirma que el metodo de pago correcto sigue vigente.",
    ],
    note: "No necesitas hacer nada mas. La renovacion de tu servicio ya ha quedado registrada.",
    accent: "green",
  })
}

export function buildInvoiceAvailableEmail(input: InvoiceAvailableEmailInput): EmailTemplate {
  return buildBrandedEmail({
    subject: `Nueva factura disponible: ${input.invoiceNumber}`,
    preheader: `La factura ${input.invoiceNumber} ya esta disponible para ${input.tenantName}.`,
    badge: "Factura",
    title: "Tu nueva factura ya esta disponible",
    intro: `Hemos generado una nueva factura para la cuenta de ${input.tenantName}. Puedes revisarla, descargarla o compartirla con tu gestor desde el enlace de abajo.`,
    detailsTitle: "Datos de la factura",
    details: [
      { label: "Factura", value: input.invoiceNumber },
      { label: "Importe", value: input.amount },
      { label: "Vencimiento", value: input.dueDate },
      { label: "Cuenta", value: input.to },
    ],
    action: { label: "Descargar factura", url: input.invoiceUrl },
    note: "Si ya has realizado el pago, puedes ignorar este recordatorio y conservar la factura para tus registros.",
    accent: "amber",
  })
}

export function buildAccountSuspendedEmail(input: AccountSuspendedEmailInput): EmailTemplate {
  return buildBrandedEmail({
    subject: `Tu cuenta esta suspendida temporalmente`,
    preheader: `La cuenta de ${input.tenantName} ha sido suspendida temporalmente y requiere revision.`,
    badge: "Cuenta suspendida",
    title: "Tu cuenta necesita revision para volver a emitir en directo",
    intro: `La cuenta de ${input.tenantName} ha quedado suspendida temporalmente. Queremos ayudarte a resolverlo cuanto antes para que recuperes tu operativa normal.`,
    detailsTitle: "Estado actual de la cuenta",
    details: [
      { label: "Tienda", value: input.tenantName },
      { label: "Email", value: input.to },
      { label: "Motivo", value: input.reason },
    ],
    action: { label: "Revisar cuenta", url: input.reactivationUrl },
    steps: [
      "Consulta el motivo de la suspension y revisa si falta alguna accion por completar.",
      "Actualiza el metodo de pago o los datos requeridos si corresponde.",
      "Contacta con soporte si necesitas una revision manual.",
    ],
    note: "Mientras la cuenta este suspendida, tu equipo no podra acceder con normalidad al servicio.",
    accent: "red",
  })
}

export function buildAccountReactivatedEmail(input: AccountReactivatedEmailInput): EmailTemplate {
  return buildBrandedEmail({
    subject: `Tu cuenta de ${input.tenantName} vuelve a estar activa`,
    preheader: `La cuenta de ${input.tenantName} se ha reactivado correctamente.`,
    badge: "Cuenta activa",
    title: "Tu cuenta vuelve a estar lista para vender",
    intro: `La reactivacion se ha completado correctamente. Ya puedes volver a acceder al panel de ${input.tenantName} y seguir gestionando tu tienda con normalidad.`,
    detailsTitle: "Estado de la reactivacion",
    details: [
      { label: "Tienda", value: input.tenantName },
      { label: "Plan activo", value: input.planName },
      ...(input.nextBillingDate ? [{ label: "Proxima renovacion", value: input.nextBillingDate }] : []),
    ],
    action: { label: "Ir al dashboard", url: input.dashboardUrl },
    steps: [
      "Accede al panel para comprobar que todo esta en orden.",
      "Revisa tus productos, horarios y estado de tu tienda publica.",
      "Confirma con tu equipo que podeis retomar la operativa habitual.",
    ],
    note: "Gracias por seguir confiando en FrescoEnVivo para vender en directo desde tu tienda.",
    accent: "green",
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
