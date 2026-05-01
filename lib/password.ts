import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateTemporaryPassword(length = 16): string {
  const charset = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"
  let password = ""
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (const val of randomValues) {
    password += charset[val % charset.length]
  }
  return password
}
