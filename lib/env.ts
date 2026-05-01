import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
    SUPERADMIN_INITIAL_EMAIL: z.string().email().optional(),
    SUPERADMIN_INITIAL_PASSWORD: z.string().min(12).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  },
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SUPERADMIN_INITIAL_EMAIL: process.env.SUPERADMIN_INITIAL_EMAIL,
    SUPERADMIN_INITIAL_PASSWORD: process.env.SUPERADMIN_INITIAL_PASSWORD,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
})
