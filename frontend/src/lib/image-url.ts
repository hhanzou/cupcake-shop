export const PLACEHOLDER_IMAGE = '/cupcake-placeholder.svg'

/** Monta a URL absoluta da imagem. `version` força o navegador a recarregar após trocar a foto. */
export function imageUrl(path: string | null | undefined, version?: string): string {
  if (!path) return PLACEHOLDER_IMAGE
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  return `${base}${path}${version ? `?v=${encodeURIComponent(version)}` : ''}`
}
