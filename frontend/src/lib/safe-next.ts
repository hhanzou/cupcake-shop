/** Aceita só caminhos internos. Qualquer outra coisa vira "/". */
export function safeNext(value: string | null | undefined): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//') || value.startsWith('/\\')) return '/'
  if (/[\u0000-\u001f]/.test(value)) return '/'
  return value
}
