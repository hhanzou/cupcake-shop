const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "20.00" -> "R$ 20,00". Só para exibição: totais e preços vêm da API. */
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

/**
 * Subtotal de uma linha do carrinho para exibição: preço unitário da API × quantidade,
 * em centavos inteiros (sem erro de ponto flutuante). O total do pedido vem sempre da API.
 */
export function multiplyPrice(unitPrice: string, quantity: number): string {
  const [int, frac = ''] = unitPrice.split('.')
  const cents = BigInt(int) * BigInt(100) + BigInt(frac.padEnd(2, '0').slice(0, 2))
  const total = cents * BigInt(quantity)
  const reais = total / BigInt(100)
  const rest = (total % BigInt(100)).toString().padStart(2, '0')
  return `${reais}.${rest}`
}
