# FrescoEnVivo — Technical Reference

## What is this project
SaaS multi-tenant platform where small fresh-product businesses (fishmongers, butchers, greengrocers) sell live via webcam streaming. The SaaS owner manages tenants from a superadmin panel. Each tenant gets an isolated DB schema, a vendor panel, and a public store page.

## User hierarchy
```
Superadmin (SaaS owner)  →  roles: admin | billing | support
    └── Vendor / Tenant  →  role: vendor
            └── End Customer  →  anonymous public user
```

## Superadmin roles
| Role | Permissions |
|---|---|
| `admin` | Full access: create/delete tenants, change plans, view all data, manage billing, manage support |
| `billing` | View/edit plans, subscriptions, invoices, tenant billing status only |
| `support` | View tenant info and store details (read-only), cannot touch billing |

## Tech stack
| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Strict mode enabled |
| Styling | Tailwind CSS v4 + shadcn/ui | |
| Database | MongoDB Atlas | Database-per-tenant isolation |
| ODM | Mongoose | Schema validation + middleware hooks |
| Auth | NextAuth v5 (credentials) | Two separate flows: superadmin + vendor |
| Streaming | LiveKit Cloud | WebRTC SFU; vendor streams from browser via getUserMedia |
| Rate limiting | Upstash Redis + @upstash/ratelimit | Applied in middleware |
| Env validation | T3 Env (Zod) | App fails fast if env vars missing |
| Input validation | Zod | All API route inputs validated before DB touch |

## Route structure
```
/login                          → superadmin login
/dashboard                      → superadmin home (admin + billing + support)
/dashboard/clients              → tenant list (admin only: create/delete)
/dashboard/clients/[id]         → tenant detail
/dashboard/billing              → billing panel (admin + billing)
/dashboard/support              → support panel (admin + support)

/[tenantSlug]/login             → vendor login
/[tenantSlug]/dashboard         → vendor home
/[tenantSlug]/dashboard/stream  → camera selection + go live
/[tenantSlug]/dashboard/queue   → turn management (post-MVP)

/[tenantSlug]                   → public store page (end customers)
```

## Database architecture
```
MongoDB Atlas
├── database: frescoenvivo                ← SaaS-level (compartida)
│   ├── collection: superadmins  { _id, email, passwordHash, role, createdAt }
│   ├── collection: plans        { _id, name, maxCameras, maxQueue, features[], priceCents, stripePriceId }
│   └── collection: tenants      { _id, slug, name, email, planId, dbName, status, createdAt }
│
└── database: tenant_{slug}               ← provisionada al crear cada tenant
    ├── collection: users    { _id, email, passwordHash, role, createdAt }
    ├── collection: store    { _id, name, description, logoUrl, isLive, activeCameras[], updatedAt }
    ├── collection: streams  { _id, livekitRoom, cameraCount, startedAt, endedAt }
    └── collection: queue    { _id, customerName, customerPhone, position, type, status, createdAt }
```

## Security requirements (non-negotiable)
- **Rate limiting**: Every public API route and auth endpoint rate-limited via Upstash Redis
- **API keys**: NEVER hardcoded. Always `process.env.VAR`. Validated at startup via T3 Env
- **NoSQL injection**: Mongoose schema typing + Zod validation prevents injection. Never pass raw user input to MongoDB operators (`$where`, `$regex`, etc.)
- **XSS / script injection**: React escapes by default. Custom `Content-Security-Policy` header in `next.config.ts`
- **Tenant isolation**: Each tenant in its own MongoDB database. App-level check: always derive dbName from the authenticated session, never from user input
- **MongoDB Atlas Security**: IP Allowlist, Atlas Auditing, least-privilege DB user per service
- **CORS**: `next.config.ts` headers + API middleware. Only `NEXT_PUBLIC_APP_URL` origin accepted
- **Auth**: bcrypt (cost 12) for password hashing. Secure HTTP-only cookies for sessions
- **Input validation**: Zod schema on every API route body and query param
- **Slug sanitization**: Tenant slugs must match `/^[a-z0-9-]+$/` before any DB operation

## Plans
| | Básico | Pro | Business |
|---|---|---|---|
| Cámaras max | 1 | 3 | 4 |
| Cola máx. | 10 | ilimitada | ilimitada |
| Analytics | — | básicos | avanzados |
| Soporte | email | email | prioritario |

## MVP scope (what to build first)
1. Superadmin auth (login, session, role middleware)
2. Superadmin panel — create tenant (provisions DB schema + creates vendor user)
3. Vendor auth (tenant-scoped login)
4. Vendor panel — camera selection (getUserMedia) + Go Live (LiveKit room)
5. Public store page — live/offline status indicator + stream viewer

**NOT in MVP**: Queue system, audio calls, payments, analytics.

## Environment variables (see .env.example)
All vars validated at startup. App refuses to start if any required var is missing.

## Key conventions
- All API routes live in `app/api/`
- Superadmin routes protected by `middleware.ts` checking session role
- Vendor routes protected by tenant slug + vendor session
- Never expose `passwordHash` in API responses (use Zod `.omit()` or Mongoose `.select("-passwordHash")`)
- Tenant slug is derived from business name, lowercased, spaces → hyphens, unique-checked before insert
- Tenant DB name is always `tenant_${slug}` — derived from session, NEVER from request body
- LiveKit tokens generated server-side only, never client-side
- All dates stored as UTC in MongoDB
- MongoDB connection: singleton pattern in `lib/db/mongodb.ts` — one connection shared across requests (critical for Next.js serverless)
