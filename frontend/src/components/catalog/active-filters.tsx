"use client"

import { X } from "lucide-react"
import { useCatalogState, type FilterKey } from "@/components/catalog/catalog-state"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/money"
import type { Category } from "@/lib/types"

const SORT_LABEL: Record<string, string> = {
  price_asc: "Menor preço",
  price_desc: "Maior preço",
}

/** Chips com os filtros em uso; cada um some com um clique. Reflete a escolha na hora. */
export function ActiveFilters({ categories }: { categories: Category[] }) {
  const { params, navigate, clear } = useCatalogState()

  const chips: { keys: FilterKey[]; label: string }[] = []
  if (params.q) chips.push({ keys: ["q"], label: `Busca: “${params.q}”` })
  if (params.category) {
    const name = categories.find((c) => c.slug === params.category)?.name ?? params.category
    chips.push({ keys: ["category"], label: `Categoria: ${name}` })
  }
  if (params.flavor) chips.push({ keys: ["flavor"], label: `Sabor: ${params.flavor}` })
  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice && formatPrice(params.minPrice)
    const max = params.maxPrice && formatPrice(params.maxPrice)
    const label = min && max ? `${min} a ${max}` : min ? `A partir de ${min}` : `Até ${max}`
    chips.push({ keys: ["minPrice", "maxPrice"], label: `Preço: ${label}` })
  }
  if (params.sort && SORT_LABEL[params.sort]) {
    chips.push({ keys: ["sort"], label: `Ordem: ${SORT_LABEL[params.sort]}` })
  }

  if (chips.length === 0) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <span
          key={chip.keys.join()}
          className="animate-pop inline-flex h-8 items-center gap-1 rounded-full border border-secondary bg-card pr-1 pl-3 text-sm font-medium shadow-soft"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => navigate(Object.fromEntries(chip.keys.map((k) => [k, undefined])))}
            className="inline-flex size-6 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Remover filtro ${chip.label}`}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Limpar tudo
        </Button>
      )}
    </div>
  )
}
