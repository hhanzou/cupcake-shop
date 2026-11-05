const TIME_ZONE = 'America/Sao_Paulo'
const MAX_DAYS_AHEAD = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type ScheduleResult = { valid: true; date: Date } | { valid: false; message: string }

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "Hoje" em São Paulo, como meia-noite UTC do mesmo dia civil. */
function todayInSaoPaulo(now: Date): number {
  const parts = formatter.formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'))
}

/**
 * Valida a data planejada (YYYY-MM-DD): de amanhã até hoje + 30 dias, sem domingos,
 * considerando o fuso America/Sao_Paulo. Devolve a data como meia-noite UTC.
 */
export function validateScheduledDate(value: string, now: Date): ScheduleResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return { valid: false, message: 'Data inválida: use o formato AAAA-MM-DD' }
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { valid: false, message: 'Data inexistente' }
  }

  const diffDays = Math.round((date.getTime() - todayInSaoPaulo(now)) / DAY_MS)
  if (diffDays < 1) {
    return { valid: false, message: 'A data deve ser a partir de amanhã' }
  }
  if (diffDays > MAX_DAYS_AHEAD) {
    return { valid: false, message: `A data deve ser em até ${MAX_DAYS_AHEAD} dias` }
  }
  if (date.getUTCDay() === 0) {
    return { valid: false, message: 'Não há atendimento aos domingos' }
  }

  return { valid: true, date }
}
