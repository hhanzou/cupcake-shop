const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "20.00" -> "R$ 20,00". Só para exibição: o front nunca calcula valores. */
export function formatPrice(value: string): string {
  return formatter.format(Number(value)).replace(/ /g, ' ')
}

/** "12,50" -> "12.50". Retorna null se for inválido ou tiver mais de 2 casas. */
export function toApiPrice(input: string): string | null {
  const normalized = input.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [int, frac = ''] = normalized.split('.')
  return `${int}.${frac.padEnd(2, '0')}`
}
