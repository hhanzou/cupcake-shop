import { Prisma } from '@prisma/client'

/** Formata como string com duas casas: "12.50". */
export function formatMoney(value: Prisma.Decimal | string | number): string {
  return new Prisma.Decimal(value).toFixed(2)
}
