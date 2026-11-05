export const PLACEHOLDER_IMAGE = '/cupcake-placeholder.svg'

/**
 * Monta a URL absoluta da imagem. A API já inclui `?v=` no caminho, que muda a cada
 * upload, então a foto nova aparece mesmo com cache.
 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return PLACEHOLDER_IMAGE
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  return `${base}${path}`
}
