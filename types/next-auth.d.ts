import "next-auth"
import "next-auth/jwt"
import type { SuperadminRole } from "@/lib/db/models/Superadmin"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: SuperadminRole
      type: "superadmin" | "vendor"
      tenantSlug?: string
    }
  }

  interface User {
    role: SuperadminRole
    type: "superadmin" | "vendor"
    tenantSlug?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: SuperadminRole
    type: "superadmin" | "vendor"
    tenantSlug?: string
  }
}
