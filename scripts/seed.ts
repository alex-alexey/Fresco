import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config() // fallback to .env
import mongoose from "mongoose"
import { hashPassword } from "../lib/password"
import { Plan } from "../lib/db/models/Plan"
import { Superadmin } from "../lib/db/models/Superadmin"

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "frescoenvivo"

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local")
  process.exit(1)
}

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME })
  console.warn("Connected to MongoDB:", MONGODB_DB_NAME)

  const plans = [
    {
      name: "Básico",
      maxCameras: 1,
      maxQueue: 10,
      features: ["1 cámara", "Cola hasta 10 turnos", "Soporte por email"],
      priceCents: 2900,
      hardwareCostCents: 56700,
      setupFeeCents: 74900,
    },
    {
      name: "Pro",
      maxCameras: 3,
      maxQueue: null,
      features: ["3 cámaras", "Cola ilimitada", "Analytics básicos", "Soporte por email"],
      priceCents: 5900,
      hardwareCostCents: 77300,
      setupFeeCents: 99900,
    },
    {
      name: "Business",
      maxCameras: 4,
      maxQueue: null,
      features: ["4 cámaras", "Cola ilimitada", "Analytics avanzados", "Soporte prioritario"],
      priceCents: 9900,
      hardwareCostCents: 87600,
      setupFeeCents: 114900,
    },
  ]

  for (const plan of plans) {
    await Plan.findOneAndUpdate({ name: plan.name }, { $set: plan }, { upsert: true })
  }
  console.warn("✓ 3 planes sincronizados")

  const adminEmail = process.env.SUPERADMIN_INITIAL_EMAIL
  const adminPassword = process.env.SUPERADMIN_INITIAL_PASSWORD

  if (adminEmail && adminPassword) {
    if (!(await Superadmin.exists({ email: adminEmail }))) {
      await Superadmin.create({
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: "ADMIN",
      })
      console.warn(`✓ Superadmin creado: ${adminEmail}`)
    } else {
      console.warn("✓ Superadmin ya existe, saltando")
    }
  } else {
    console.warn("⚠ SUPERADMIN_INITIAL_EMAIL / PASSWORD no configurados, saltando")
  }

  await mongoose.disconnect()
  console.warn("✓ Seed completado")
}

seed().catch((err) => {
  console.error("Seed error:", err)
  process.exit(1)
})
