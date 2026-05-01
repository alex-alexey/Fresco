const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export function sanitizeSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)

  if (!SLUG_REGEX.test(slug)) {
    throw new Error(`Invalid slug: "${slug}". Must be 3-50 chars, lowercase letters, numbers and hyphens only.`)
  }

  return slug
}

export function tenantDbName(slug: string): string {
  return `tenant_${sanitizeSlug(slug)}`
}
