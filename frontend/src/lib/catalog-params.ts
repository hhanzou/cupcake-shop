import type { ProductSort } from './types'

export type CatalogParams = {
  q?: string
  flavor?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  sort?: ProductSort
  page: number
}

type RawParams = Record<string, string | string[] | undefined>

const SORTS: ProductSort[] = ['price_asc', 'price_desc', 'newest']
const PRICE = /^\d+(\.\d{1,2})?$/

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

/** Limpa os searchParams: omite vazios e descarta valores inválidos, para a API não responder 400. */
export function parseCatalogParams(raw: RawParams): CatalogParams {
  const sort = first(raw.sort)
  const minPrice = first(raw.minPrice)
  const maxPrice = first(raw.maxPrice)
  const pageText = first(raw.page)
  const page = pageText && /^\d+$/.test(pageText) ? Number(pageText) : 1

  return {
    q: first(raw.q),
    flavor: first(raw.flavor),
    category: first(raw.category),
    minPrice: minPrice && PRICE.test(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && PRICE.test(maxPrice) ? maxPrice : undefined,
    sort: sort && SORTS.includes(sort as ProductSort) ? (sort as ProductSort) : undefined,
    page: page >= 1 ? page : 1,
  }
}
