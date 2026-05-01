# FrescoEnVivo — Build Roadmap

Estado: cada step se completa antes de pasar al siguiente.
Prefijo de estado: ⬜ pendiente | 🔄 en progreso | ✅ completado

---

## STEP 1 — Project Setup & Foundation
**Objetivo**: Proyecto Next.js corriendo con todas las dependencias base instaladas.

### Tareas
- [ ] `npx create-next-app@latest` con TypeScript, Tailwind, App Router, src/ off
- [ ] Instalar dependencias core:
  ```
  next-auth@beta
  mongoose
  @upstash/redis @upstash/ratelimit
  zod
  @t3-oss/env-nextjs
  bcryptjs @types/bcryptjs
  livekit-server-sdk
  @livekit/components-react @livekit/components-styles
  shadcn/ui (init)
  ```
- [ ] Configurar `tsconfig.json` con strict mode y path aliases (`@/*`)
- [ ] Estructura de carpetas según CLAUDE.md
- [ ] Configurar `.env.local` con variables (copiar de `.env.example`)
- [ ] Validación de env vars con T3 Env en `lib/env.ts` — app falla si faltan
- [ ] Configurar ESLint + Prettier
- [ ] Verificar que `npm run dev` arranca sin errores

### Criterio de éxito
`http://localhost:3000` carga sin errores. `npm run build` sin warnings de TypeScript.

---

## STEP 2 — Security Foundation
**Objetivo**: Toda la infraestructura de seguridad configurada ANTES de escribir features.
Principio: seguridad desde el día 1, no como afterthought.

### Tareas
- [ ] **CORS** — `next.config.ts`: headers que solo permiten `NEXT_PUBLIC_APP_URL`
- [ ] **CSP** — `Content-Security-Policy` header en `next.config.ts`
  - `default-src 'self'`
  - `connect-src 'self' wss://*.livekit.cloud`
  - `media-src 'self' blob:`
- [ ] **Rate limiting** — `lib/rate-limit.ts` con Upstash Redis
  - Auth endpoints: 5 intentos / 15 min por IP
  - API general: 100 req / min por IP
- [ ] **Middleware** — `middleware.ts`:
  - Aplica rate limit en rutas `/api/*` y `/*/login`
  - Protege rutas de superadmin: redirige si no hay sesión válida
  - Protege rutas de vendor: valida slug + sesión de vendor
- [ ] **Input validation helper** — `lib/validate.ts`: wrapper Zod para API routes
- [ ] **Slug sanitizer** — `lib/slug.ts`: regex `/^[a-z0-9-]+$/`, max 50 chars
- [ ] **Supabase RLS**: activar RLS en todas las tablas del schema público desde inicio
- [ ] **Security headers** completos (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy)

### Criterio de éxito
Ejecutar `curl` con Origin incorrecto → 403. Más de 5 logins fallidos → 429.

---

## STEP 3 — Database Setup (MongoDB Atlas + Mongoose)
**Objetivo**: Cluster Atlas configurado, modelos Mongoose del schema SaaS, y función de provisioning de tenant.

### Tareas
- [ ] Crear cluster en MongoDB Atlas (M0 free para desarrollo, M10+ para producción)
- [ ] Configurar IP Allowlist en Atlas (solo IPs conocidas + Vercel en prod)
- [ ] Crear DB user con permisos mínimos (readWrite sobre `frescoenvivo` y `tenant_*`)
- [ ] Activar **MongoDB Atlas Auditing** en el dashboard (Tier M10+)
- [ ] `lib/db/mongodb.ts` — singleton de conexión Mongoose (patrón crítico para Next.js serverless):
  ```typescript
  // Cached connection para evitar múltiples conexiones en hot reload
  let cached = global.mongoose ?? { conn: null, promise: null }
  ```
- [ ] Modelos Mongoose en `lib/db/models/` (schema SaaS):
  - `Superadmin.ts`: `{ email, passwordHash, role: enum[ADMIN, BILLING, SUPPORT], createdAt }`
  - `Plan.ts`: `{ name, maxCameras, maxQueue, features: [String], priceCents, stripePriceId }`
  - `Tenant.ts`: `{ slug (unique), name, email, planId, dbName, status, createdAt }`
- [ ] `lib/db/tenant.ts` — funciones de acceso al DB del tenant:
  - `getTenantDb(slug)`: conecta al DB `tenant_{slug}` y devuelve modelos Mongoose
  - `provisionTenantDb(slug)`: crea las colecciones con sus índices
  - `createVendorUser(slug, email, passwordHash)`
  - `getTenantStore(slug)`
  - `setLiveStatus(slug, isLive)`
- [ ] Modelos del tenant (usados dinámicamente vía `getTenantDb`):
  - `UserSchema`, `StoreSchema`, `StreamSchema`, `QueueSchema`
- [ ] Seed script `scripts/seed.ts`: 3 planes + 1 superadmin ADMIN inicial
- [ ] Índices:
  - `tenants.slug`: unique index
  - `tenant_{slug}.users.email`: unique index
  - `tenant_{slug}.queue.position`: index

### Estructura de modelos tenant
```typescript
// Registrados dinámicamente en cada DB de tenant
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, default: 'vendor' },
  createdAt: { type: Date, default: Date.now },
})

const StoreSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  logoUrl: String,
  isLive: { type: Boolean, default: false },
  activeCameras: [Number],
  updatedAt: { type: Date, default: Date.now },
})

const StreamSchema = new Schema({
  livekitRoom: { type: String, required: true },
  cameraCount: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
})

const QueueSchema = new Schema({
  customerName: { type: String, required: true },
  customerPhone: String,
  position: { type: Number, required: true },
  type: { type: String, enum: ['online', 'presencial'], required: true },
  status: { type: String, enum: ['waiting', 'called', 'served', 'cancelled'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
})
```

### Criterio de éxito
`scripts/seed.ts` ejecuta sin errores → Atlas muestra DB `frescoenvivo` con 3 planes y 1 superadmin. Ejecutar provisioning → DB `tenant_test` creada con 4 colecciones.

---

## STEP 4 — Auth: Superadmin
**Objetivo**: Login de superadmin funcional con roles y rutas protegidas.

### Tareas
- [ ] `lib/auth.ts` — NextAuth config con credentials provider para superadmin:
  - Busca en `superadmins` table
  - Verifica bcrypt (cost 12)
  - JWT incluye `{ id, email, role, type: 'superadmin' }`
- [ ] `app/(superadmin)/login/page.tsx` — formulario de login
- [ ] `app/api/auth/[...nextauth]/route.ts`
- [ ] Middleware role-check: rutas `/dashboard/clients` → solo `ADMIN`; `/dashboard/billing` → `ADMIN | BILLING`; `/dashboard/support` → `ADMIN | SUPPORT`
- [ ] Hook `useRequireRole(role)` — redirige si el rol no coincide
- [ ] Componente `RoleGuard` para envolver secciones de UI
- [ ] Rate limit aplicado al endpoint de login (5 intentos / 15min / IP)
- [ ] Logout y limpieza de sesión

### Criterio de éxito
Login con credenciales incorrectas → error. Login correcto → redirige a `/dashboard`. Role BILLING intenta ir a `/dashboard/clients` → 403.

---

## STEP 5 — Superadmin Panel
**Objetivo**: Panel completo con gestión de clientes y acceso diferenciado por rol.

### Tareas

#### Layout y navegación
- [ ] `app/(superadmin)/dashboard/layout.tsx` — sidebar con navegación por rol
- [ ] Sidebar items: Dashboard, Clientes (admin), Facturación (admin+billing), Soporte (admin+support)
- [ ] Header con nombre + rol del superadmin logueado + logout

#### Dashboard home
- [ ] `app/(superadmin)/dashboard/page.tsx` — métricas básicas:
  - Total tenants, tenants activos, tenants por plan

#### Gestión de clientes (solo ADMIN)
- [ ] `app/(superadmin)/dashboard/clients/page.tsx` — tabla de tenants con filtros y búsqueda
- [ ] Botón "Nuevo cliente" → modal/drawer con formulario:
  - Nombre del negocio, email del vendor, selección de plan, slug (auto-generado, editable)
  - Preview de la URL resultante: `frescoenvivo.com/{slug}`
- [ ] `app/api/superadmin/tenants/route.ts`:
  - `POST`: valida input (Zod), sanitiza slug, verifica unicidad, crea tenant en DB, llama `provisionTenantSchema(slug)`, crea vendor user con password temporal, devuelve credenciales
  - `GET`: lista tenants con paginación
- [ ] `app/(superadmin)/dashboard/clients/[id]/page.tsx` — detalle: plan, estado, cambiar estado (activo/suspendido)
- [ ] Acciones: cambiar plan, suspender tenant, copiar credenciales iniciales

#### Facturación (ADMIN + BILLING)
- [ ] `app/(superadmin)/dashboard/billing/page.tsx` — lista de tenants con plan y estado de pago
- [ ] Vista de planes disponibles + edición de precios (solo ADMIN)

#### Soporte (ADMIN + SUPPORT)
- [ ] `app/(superadmin)/dashboard/support/page.tsx` — lista de tenants con info de contacto
- [ ] Vista de detalle de tienda (solo lectura): plan, estado live, conteo de streams

### Criterio de éxito
ADMIN crea tenant → schema provisionado en Supabase → aparece en lista. BILLING no ve botón "Nuevo cliente". SUPPORT no ve facturación.

---

## STEP 6 — Auth: Vendor (Tenant-scoped)
**Objetivo**: Cada tenant tiene su propio login en `/{slug}/login`.

### Tareas
- [ ] Segunda configuración de NextAuth (o segundo provider en el mismo) para vendors:
  - Busca en `tenant_{slug}.users`
  - JWT incluye `{ id, email, role: 'vendor', tenantSlug, type: 'vendor' }`
- [ ] `app/(vendor)/[tenantSlug]/login/page.tsx`
- [ ] `app/api/vendor/auth/[...nextauth]/route.ts` — con tenantSlug en contexto
- [ ] Middleware: rutas `/{slug}/dashboard/*` → requiere sesión vendor con tenantSlug coincidente
- [ ] Verificar que un vendor no puede acceder al dashboard de otro tenant
- [ ] Rate limit en login de vendor (5 intentos / 15min / IP)
- [ ] Página de error si el slug no existe (`notFound()`)

### Criterio de éxito
Vendor de `pescaderia-pepe` no puede acceder a `/fruteria-ana/dashboard`. Slug inexistente → 404.

---

## STEP 7 — Vendor Panel: Stream (MVP Core)
**Objetivo**: El vendor puede seleccionar sus cámaras USB y emitir en directo.

### Tareas

#### Detección de cámaras
- [ ] `components/vendor/stream/CameraSelector.tsx`:
  - `navigator.mediaDevices.enumerateDevices()` → filtra `videoinput`
  - Lista de cámaras disponibles con toggle (activa/inactiva)
  - Preview de cada cámara en tiempo real con `getUserMedia`
  - Límite de cámaras según plan del tenant (1, 3 o 4)
  - Manejo de permisos denegados (mensaje de error claro)
- [ ] `hooks/useCameras.ts` — lógica de detección y gestión de streams locales

#### LiveKit Integration
- [ ] `lib/livekit.ts`:
  - `createVendorToken(slug, roomName)` — token con permisos `canPublish: true`
  - `createViewerToken(slug, roomName)` — token con permisos `canSubscribe: true, canPublish: false`
  - Tokens generados SOLO server-side
- [ ] `app/api/vendor/stream/start/route.ts`:
  - Valida sesión vendor
  - Crea sala LiveKit con nombre `{slug}-{timestamp}`
  - Guarda stream en DB (`tenant_{slug}.streams`)
  - Actualiza `store.is_live = true`
  - Devuelve token + room name al vendor
- [ ] `app/api/vendor/stream/stop/route.ts`:
  - Cierra sala LiveKit
  - Actualiza `streams.ended_at`
  - Actualiza `store.is_live = false`
- [ ] `app/(vendor)/[tenantSlug]/dashboard/stream/page.tsx`:
  - UI con CameraSelector + botón "Iniciar transmisión" / "Finalizar"
  - Estado en tiempo real: live indicator, duración del stream
  - Una vez activo: preview de las cámaras publicadas

### Criterio de éxito
Vendor selecciona 2 cámaras, pulsa "Go Live" → LiveKit room activa → `is_live = true` en DB. Pulsa "Stop" → room cerrada → `is_live = false`.

---

## STEP 8 — Public Store Page (MVP)
**Objetivo**: La página pública muestra si la tienda está en directo y permite ver el stream.

### Tareas
- [ ] `app/(public)/[tenantSlug]/page.tsx`:
  - Carga info de la tienda (nombre, descripción, logo)
  - Muestra badge "EN DIRECTO" / "CERRADO" según `store.is_live`
  - Si está en directo: solicita viewer token y renderiza player de LiveKit
  - Si está cerrado: mensaje de cuándo volver (post-MVP)
- [ ] `app/api/public/[tenantSlug]/token/route.ts`:
  - Rate limit: 30 req / min / IP
  - Solo genera token si la tienda está en directo
  - Token de solo lectura (canPublish: false)
- [ ] `components/public/StreamViewer.tsx` — player LiveKit multi-track (una pista por cámara)
- [ ] SEO básico: metadata con nombre de tienda

### Criterio de éxito
Con stream activo, abrir `/{slug}` en navegador → se ve el stream en vivo. Sin stream → badge "CERRADO".

---

## STEP 9 — Polish & Pre-launch Checks
**Objetivo**: Proyecto limpio, seguro y listo para los primeros clientes.

### Tareas
- [ ] Ejecutar **Supabase Security Advisor** → resolver todos los warnings
- [ ] Revisar todos los `console.log` → eliminar o convertir a logger
- [ ] Verificar que NINGUNA API key aparece en código (grep por hardcoded secrets)
- [ ] Test de rate limiting manual (superar límites → confirmar 429)
- [ ] Test CORS: request desde origen diferente → 403
- [ ] Test de roles: cada rol solo ve lo que debe ver
- [ ] `npm run build` sin errores ni warnings TypeScript
- [ ] Lighthouse score en página pública > 85
- [ ] Variables de entorno documentadas en `.env.example` actualizadas

---

## STEPS Post-MVP (futuro)

### STEP 10 — Sistema de Cola en tiempo real
- Cola online + presencial con Supabase Realtime
- Gestión de turnos desde el panel vendor
- Vista del cliente: posición en cola en tiempo real

### STEP 11 — Llamadas de Audio
- LiveKit audio room entre vendor y cliente cuando es su turno
- Notificación al cliente cuando le toca (sonido + visual)

### STEP 12 — Pagos (Stripe)
- Stripe Subscriptions para los 3 planes
- Portal de facturación para tenants
- Webhooks para activar/suspender tenants

### STEP 13 — Analytics
- Dashboard vendor: historial de streams, clientes atendidos
- Dashboard superadmin: métricas de uso por tenant
