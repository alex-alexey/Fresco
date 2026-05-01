import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { connectDB } from "@/lib/db/mongodb"
import { Superadmin } from "@/lib/db/models/Superadmin"
import { getTenantModels } from "@/lib/db/tenant-models"
import { verifyPassword } from "@/lib/password"
import { authRateLimit, getIp } from "@/lib/rate-limit"
import { sanitizeSlug } from "@/lib/slug"
import { env } from "@/lib/env"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

const SuperadminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const VendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      id: "superadmin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip = getIp(request as Request)
        const { success } = await authRateLimit.limit(`superadmin:${ip}`)
        if (!success) return null

        const parsed = SuperadminLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        await connectDB()

        const admin = await Superadmin.findOne({ email: parsed.data.email }).select("+passwordHash")
        if (!admin) return null

        const valid = await verifyPassword(parsed.data.password, admin.passwordHash)
        if (!valid) return null

        return {
          id: admin._id.toString(),
          email: admin.email,
          role: admin.role,
          type: "superadmin" as const,
        }
      },
    }),

    Credentials({
      id: "vendor-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials, request) {
        const ip = getIp(request as Request)

        const parsed = VendorLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        let slug: string
        try {
          slug = sanitizeSlug(parsed.data.tenantSlug)
        } catch {
          return null
        }

        // Rate limit per tenant slug to prevent cross-tenant brute force
        const { success } = await authRateLimit.limit(`vendor:${slug}:${ip}`)
        if (!success) return null

        const { User } = await getTenantModels(slug)
        const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash")
        if (!user) return null

        const valid = await verifyPassword(parsed.data.password, user.passwordHash as string)
        if (!valid) return null

        return {
          id: user._id.toString(),
          email: user.email as string,
          role: "SUPPORT" as SuperadminRole, // unused for vendors, required by User type
          type: "vendor" as const,
          tenantSlug: slug,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id
        token.role = (user as { role: SuperadminRole }).role
        token.type = (user as { type: "superadmin" | "vendor" }).type
        token.tenantSlug = (user as { tenantSlug?: string }).tenantSlug
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as SuperadminRole
      session.user.type = token.type as "superadmin" | "vendor"
      session.user.tenantSlug = token.tenantSlug
      return session
    },
  },
  pages: {
    signIn: "/ops",
    error: "/ops",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
})
