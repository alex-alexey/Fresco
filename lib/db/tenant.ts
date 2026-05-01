import { getTenantModels, provisionTenantDb, type ITenantStore } from "@/lib/db/tenant-models"
import { hashPassword, generateTemporaryPassword } from "@/lib/password"

const defaultDay = { open: "09:00", close: "14:00", closed: false }

function buildDefaultStore(name: string) {
  return {
    name,
    description: `Bienvenidos a ${name}. Aquí encontrarás los mejores productos frescos del día, seleccionados con cuidado para ofrecerte la mejor calidad. ¡Síguenos en directo!`,
    logoUrl: null,
    isLive: false,
    activeCameras: [],
    theme: { primaryColor: "#22c55e" },
    schedule: {
      mon: { ...defaultDay },
      tue: { ...defaultDay },
      wed: { ...defaultDay },
      thu: { ...defaultDay },
      fri: { ...defaultDay },
      sat: { open: "09:00", close: "13:00", closed: false },
    },
    products: [
      { name: "Producto destacado 1", description: "Describe aquí tu primer producto estrella. Edítalo desde Configuración.", imageUrl: null },
      { name: "Producto destacado 2", description: "Añade una descripción atractiva para este producto. Edítalo desde Configuración.", imageUrl: null },
      { name: "Producto destacado 3", description: "Cuéntale a tus clientes qué hace especial este producto. Edítalo desde Configuración.", imageUrl: null },
    ],
    social: { instagram: null, facebook: null, tiktok: null },
    contact: {
      phone: "600 000 000",
      email: `hola@${name.toLowerCase().replace(/\s+/g, "")}.com`,
      address: "Tu dirección — edítala desde Configuración",
    },
  }
}

export async function getOrCreateStore(slug: string, name: string): Promise<ITenantStore> {
  const { Store } = await getTenantModels(slug)
  const existing = await Store.findOne()

  if (!existing) {
    return (await Store.create(buildDefaultStore(name))).toObject() as ITenantStore
  }

  // Backfill missing fields on stores created before the schema update
  const update: Record<string, unknown> = {}
  if (!existing.description) update.description = buildDefaultStore(name).description
  if (!existing.theme?.primaryColor) update.theme = { primaryColor: "#22c55e" }
  if (!existing.schedule?.mon) update.schedule = buildDefaultStore(name).schedule
  if (!existing.products?.length) update.products = buildDefaultStore(name).products
  if (!existing.social) update.social = { instagram: null, facebook: null, tiktok: null }
  if (!existing.contact?.phone && !existing.contact?.email && !existing.contact?.address) {
    update.contact = buildDefaultStore(name).contact
  }

  if (Object.keys(update).length > 0) {
    return (await Store.findOneAndUpdate({}, { $set: update }, { returnDocument: "after" }))!.toObject() as ITenantStore
  }

  return existing.toObject() as ITenantStore
}

export async function createVendorUser(slug: string, email: string): Promise<string> {
  const tempPassword = generateTemporaryPassword()
  const { User } = await getTenantModels(slug)
  await User.create({ email, passwordHash: await hashPassword(tempPassword), role: "vendor" })
  return tempPassword
}

export async function setupTenant(slug: string, email: string, name: string): Promise<string> {
  await provisionTenantDb(slug)
  await getOrCreateStore(slug, name)
  return createVendorUser(slug, email)
}
