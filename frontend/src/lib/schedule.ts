const TIME_ZONE = 'America/Sao_Paulo'
const MAX_DAYS_AHEAD = 30

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Dia de hoje em São Paulo, como data UTC à meia-noite (usada só para aritmética de dias). */
function todayInSaoPaulo(now: Date): Date {
  const text = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const [y, m, d] = text.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Datas disponíveis para agendamento: de amanhã até 30 dias à frente, sem domingos. */
export function getAvailableDates(now: Date = new Date()): string[] {
  const today = todayInSaoPaulo(now)
  const dates: string[] = []
  for (let i = 1; i <= MAX_DAYS_AHEAD; i++) {
    const day = new Date(today.getTime() + i * 86_400_000)
    if (day.getUTCDay() === 0) continue
    dates.push(toIso(day))
  }
  return dates
}

/** "2026-11-20" -> "20/11/2026", sem passar por `new Date(string)`. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** "YYYY-MM-DD" -> Date local ao meio-dia, para o calendário não deslocar o dia. */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Instante (ISO com hora) -> "20/11/2026" no fuso de São Paulo. */
export function formatInstantDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE }).format(new Date(iso))
}
