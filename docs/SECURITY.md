# FrescoEnVivo — Security Specification

## Principios generales
1. Seguridad desde el día 1, nunca como afterthought
2. Nunca confiar en el cliente — toda validación crítica en el servidor
3. Principio de mínimo privilegio — cada rol solo accede a lo que necesita
4. Defense in depth — múltiples capas, no un único punto de control

---

## 1. Variables de entorno

### Reglas absolutas
- Ninguna API key, secret o password en el código fuente
- Todas las variables validadas al arrancar con T3 Env (Zod)
- Si falta una variable requerida → la app no arranca (fail fast)
- `.env.local` en `.gitignore` — nunca comiteado
- `.env.example` comiteado con todos los nombres de variables pero SIN valores

### Implementación
```typescript
// lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    LIVEKIT_API_KEY: z.string().min(1),
    LIVEKIT_API_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    SUPERADMIN_INITIAL_EMAIL: z.string().email(),
    SUPERADMIN_INITIAL_PASSWORD: z.string().min(12),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_LIVEKIT_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ... resto de vars
  },
})
```

---

## 2. Rate Limiting

### Configuración por endpoint
| Endpoint | Límite | Ventana | Scope |
|---|---|---|---|
| `POST /api/auth/*/login` | 5 req | 15 min | por IP |
| `POST /api/superadmin/tenants` | 10 req | 1 hora | por IP |
| `GET /api/public/[slug]/token` | 30 req | 1 min | por IP |
| `GET /api/*` (general) | 100 req | 1 min | por IP |

### Implementación
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:auth",
})

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:api",
})

// En middleware.ts o en cada route handler:
export async function withRateLimit(req: Request, limiter: Ratelimit) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await limiter.limit(ip)
  if (!success) {
    return new Response("Too Many Requests", { status: 429 })
  }
}
```

---

## 3. CORS

### Configuración en next.config.ts
```typescript
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL

const securityHeaders = [
  {
    key: "Access-Control-Allow-Origin",
    value: allowedOrigin,
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET, POST, PUT, DELETE, OPTIONS",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "Content-Type, Authorization",
  },
]
```

### Verificación en API routes
```typescript
// lib/cors.ts
export function checkOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  return origin === process.env.NEXT_PUBLIC_APP_URL
}
```

---

## 4. Content Security Policy

### Headers configurados en next.config.ts
```
default-src 'self'
script-src 'self' 'unsafe-inline' (solo para Next.js inline scripts)
style-src 'self' 'unsafe-inline'
img-src 'self' blob: data: https://*.supabase.co
media-src 'self' blob:
connect-src 'self' wss://*.livekit.cloud https://*.livekit.cloud https://*.supabase.co
frame-ancestors 'none'
```

### Otros security headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=() (solo para páginas que no lo necesitan)
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

**Nota**: Las páginas del vendor stream NECESITAN `camera` y `microphone` en Permissions-Policy. Usar header diferente para esas rutas.

---

## 5. Protección contra NoSQL Injection

Con MongoDB, el riesgo no es SQL injection sino **NoSQL injection** — un atacante que inyecta operadores MongoDB (`$where`, `$gt`, `$regex`, etc.) en el body de una request.

### Capa 1 — Mongoose schema typing
Mongoose castea los valores según el tipo definido en el schema. Si el campo es `String`, un objeto `{ $where: "..." }` será rechazado o convertido a string.

### Capa 2 — Nunca pasar req.body directamente a MongoDB
```typescript
// MAL — vulnerable
await User.findOne(req.body)

// BIEN — validado con Zod primero
const { email } = LoginSchema.parse(req.body)
await User.findOne({ email })
```

### Capa 3 — Validación de input con Zod (obligatoria en toda API route)
```typescript
// Ejemplo en POST /api/superadmin/tenants
const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  planId: z.string().regex(/^[0-9a-f]{24}$/), // MongoDB ObjectId format
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
})
```

### Capa 4 — Slug sanitization (crítico: se usa como nombre de DB)
```typescript
// lib/slug.ts
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export function sanitizeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)

  if (!SLUG_REGEX.test(slug)) {
    throw new Error("Invalid slug format")
  }
  return slug
}
// El DB name del tenant SIEMPRE es `tenant_${sanitizeSlug(slug)}`
// y se deriva de la sesión autenticada, NUNCA del body del request
```

### Capa 5 — Tenant isolation a nivel de aplicación
El nombre del DB del tenant (`tenant_{slug}`) NUNCA viene del request body. Siempre se deriva del `tenantSlug` de la sesión JWT autenticada:

```typescript
// MAL — el cliente podría enviar cualquier dbName
const dbName = req.body.dbName

// BIEN — siempre desde la sesión
const { tenantSlug } = await getServerSession(authOptions)
const dbName = `tenant_${tenantSlug}`
```

---

## 6. Protección contra XSS / Script Injection

### Capa 1 — React escaping
React escapa automáticamente todo contenido renderizado en JSX. Nunca usar `dangerouslySetInnerHTML` con input del usuario.

### Capa 2 — CSP
El header CSP bloquea scripts inline y de terceros no autorizados.

### Capa 3 — Sanitización de outputs
Nombres de tienda, descripciones, etc. mostradas en la UI pública no necesitan sanitización adicional gracias a React, pero se validan en input (longitud, caracteres permitidos).

---

## 7. Tenant Isolation en MongoDB

La separación de datos entre tenants se implementa con **bases de datos separadas** dentro del mismo cluster Atlas.

### Principios
- DB `frescoenvivo`: datos SaaS (superadmins, planes, tenants). Solo accesible desde el servidor.
- DB `tenant_{slug}`: datos de cada negocio. Solo accesible desde el servidor con el slug de la sesión.
- El cliente (browser) NUNCA conecta directamente a MongoDB — todo pasa por las API routes de Next.js.

### DB user de MongoDB Atlas
```
Usuario: frescoenvivo-app
Permisos: readWrite en frescoenvivo.* y tenant_*.* 
NO tiene: clusterAdmin, dbAdmin, ni acceso a otras DBs
```

### Validación de acceso en código
```typescript
// lib/db/tenant.ts
export async function getTenantDb(slug: string) {
  const safeSlug = sanitizeSlug(slug) // siempre sanitizar
  const conn = await getMongoConnection()
  return conn.useDb(`tenant_${safeSlug}`, { useCache: true })
}
```

---

## 8. MongoDB Atlas Security

### Configuración obligatoria en Atlas
1. **IP Allowlist**: Solo las IPs del equipo de desarrollo + IPs de Vercel (producción). No `0.0.0.0/0`.
2. **Auditing** (M10+): Activar audit logs para operaciones de escritura (insert, update, delete, drop).
3. **Encryption at rest**: Habilitado por defecto en Atlas M10+. Verificar que está activo.
4. **TLS obligatorio**: Verificar que `ssl=true` en el connection string y que Atlas rechaza conexiones sin TLS.
5. **Atlas Security Quickstart**: Completar el checklist del dashboard de Atlas antes de producción.

### Checklist Atlas pre-producción
- [ ] IP Allowlist configurada (sin `0.0.0.0/0`)
- [ ] DB user con permisos mínimos
- [ ] Audit logging activado
- [ ] Backup automático activado (M10+)
- [ ] Alertas de Atlas configuradas (conexiones fallidas, CPU alta)
- [ ] `MONGODB_URI` no expuesto en logs ni en código

### Proceso de revisión
```bash
# Antes de cada deploy a producción:
# 1. Atlas Dashboard → Security → Database Access → verificar permisos del user
# 2. Atlas Dashboard → Security → Network Access → verificar IP allowlist
# 3. Atlas Dashboard → Activity Feed → revisar operaciones recientes
```

---

## 9. Password Hashing

```typescript
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

Requisitos mínimos de contraseña:
- Superadmin: mínimo 12 caracteres
- Vendor (password temporal): 16 caracteres aleatorios generados por el sistema
- Vendor puede cambiar su password desde el panel (post-MVP)

---

## 10. Sesiones y JWT

```typescript
// NextAuth session config
session: {
  strategy: "jwt",
  maxAge: 8 * 60 * 60, // 8 horas
},
jwt: {
  maxAge: 8 * 60 * 60,
},
cookies: {
  sessionToken: {
    options: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
},
```

El JWT incluye:
```typescript
{
  id: string,
  email: string,
  role: "ADMIN" | "BILLING" | "SUPPORT" | "vendor",
  type: "superadmin" | "vendor",
  tenantSlug?: string, // solo para vendors
}
```

---

## 11. Checklist de Seguridad por Deploy

Antes de desplegar a producción:
- [ ] Completar checklist de Atlas Security (IP Allowlist, DB user permisos mínimos, audit logs activos)
- [ ] `grep -rn "mongodb+srv\|LIVEKIT_API_SECRET\|NEXTAUTH_SECRET" --include="*.ts" app/ lib/` → 0 resultados
- [ ] Todas las variables de `.env.example` configuradas en el entorno de producción
- [ ] Rate limiting testado manualmente (superar límites → confirmar 429)
- [ ] CORS testado con origen diferente → 403
- [ ] Test de tenant isolation: vendor de tenant A no puede acceder a datos de tenant B
- [ ] Test de roles: BILLING no ve clients, SUPPORT no ve billing
- [ ] `npm audit` → 0 vulnerabilidades críticas o altas
- [ ] `npm run build` → 0 errores TypeScript
- [ ] Lighthouse score en página pública > 85
