import mongoose from "mongoose"
import { env } from "@/lib/env"

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Singleton cached across Next.js hot reloads in development
const cached: CachedConnection = (global as typeof global & { mongoose?: CachedConnection })
  .mongoose ?? { conn: null, promise: null }

if (!(global as typeof global & { mongoose?: CachedConnection }).mongoose) {
  (global as typeof global & { mongoose?: CachedConnection }).mongoose = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

// Returns a connection to a tenant's isolated database
export async function getTenantConnection(dbName: string): Promise<mongoose.Connection> {
  await connectDB()
  return mongoose.connection.useDb(dbName, { useCache: true })
}
