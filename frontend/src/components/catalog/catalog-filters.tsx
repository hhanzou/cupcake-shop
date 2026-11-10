"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle, SlidersHorizontal } from "lucide-react"
import { FILTER_KEYS, useCatalogState } from "@/components/catalog/catalog-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toApiPrice } from "@/lib/money"
import type { Category } from "@/lib/types"

type Props = {
  categories: Category[]
  flavors: string[]
}

/** "12.50" (URL) -> "12,50" (campo). */
const toInput = (value: string | undefined) => (value ? value.replace(".", ",") : "")

/**
 * Mantém um campo de texto em sincronia com a URL sem atrapalhar a digitação:
 * só sobrescreve o que o usuário digitou quando a URL muda por fora (voltar, limpar, chip).
 */
function useSyncedField(urlValue: string) {
  const [value, setValue] = useState(urlValue)
  const [lastUrlValue, setLastUrlValue] = useState(urlValue)
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue)
    setValue(urlValue)
  }
  return [value, setValue] as const
}

function FiltersForm({ categories, flavors, idPrefix }: Props & { idPrefix: string }) {
  const { params, navigate } = useCatalogState()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [q, setQ] = useSyncedField(params.q ?? "")
  const [minPrice, setMinPrice] = useSyncedField(toInput(params.minPrice))
  const [maxPrice, setMaxPrice] = useSyncedField(toInput(params.maxPrice))
  const [priceError, setPriceError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  function onSearch(value: string) {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (value.trim() !== (params.q ?? "")) navigate({ q: value.trim() || undefined })
    }, 300)
  }

  function applyPrices() {
    const min = minPrice.trim() ? toApiPrice(minPrice) : null
    const max = maxPrice.trim() ? toApiPrice(maxPrice) : null
    if ((minPrice.trim() && !min) || (maxPrice.trim() && !max)) {
      setPriceError("Use valores como 12,50")
      return
    }
    if (min && max && Number(min) > Number(max)) {
      setPriceError("O mínimo não pode ser maior que o máximo")
      return
    }
    setPriceError(null)
    if ((min ?? undefined) !== params.minPrice || (max ?? undefined) !== params.maxPrice) {
      navigate({ minPrice: min ?? undefined, maxPrice: max ?? undefined })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-q`}>Pesquisar</Label>
        <Input
          id={`${idPrefix}-q`}
          type="search"
          value={q}
          placeholder="Nome ou descrição"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`}>Categoria</Label>
        <NativeSelect
          id={`${idPrefix}-category`}
          value={params.category ?? ""}
          onChange={(e) => navigate({ category: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-flavor`}>Sabor</Label>
        <NativeSelect
          id={`${idPrefix}-flavor`}
          value={params.flavor ?? ""}
          onChange={(e) => navigate({ flavor: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {flavors.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </NativeSelect>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm leading-none font-medium">Preço (R$)</legend>
        <div className="flex gap-2">
          <Input
            aria-label="Preço mínimo"
            inputMode="decimal"
            placeholder="Mín."
            value={minPrice}
            aria-invalid={priceError ? true : undefined}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPrices}
            onKeyDown={(e) => e.key === "Enter" && applyPrices()}
          />
          <Input
            aria-label="Preço máximo"
            inputMode="decimal"
            placeholder="Máx."
            value={maxPrice}
            aria-invalid={priceError ? true : undefined}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPrices}
            onKeyDown={(e) => e.key === "Enter" && applyPrices()}
          />
        </div>
        {priceError ? (
          <p role="alert" className="text-sm text-destructive">
            {priceError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Aplica ao sair do campo ou com Enter.</p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>Ordenar por</Label>
        <NativeSelect
          id={`${idPrefix}-sort`}
          value={params.sort ?? ""}
          onChange={(e) => navigate({ sort: e.target.value || undefined })}
        >
          <option value="">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </NativeSelect>
      </div>
    </div>
  )
}

function PendingIcon() {
  const { isPending } = useCatalogState()
  if (!isPending) return null
  return <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Atualizando" />
}

export function CatalogFilters(props: Props) {
  const { params, clear } = useCatalogState()
  const activeCount = FILTER_KEYS.filter((k) => params[k]).length - (params.minPrice && params.maxPrice ? 1 : 0)

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-4 rounded-3xl border border-secondary bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              Filtros <PendingIcon />
            </h2>
            {activeCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Limpar
              </Button>
            )}
          </div>
          <FiltersForm {...props} idPrefix="desk" />
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="secondary" />}>
            <SlidersHorizontal aria-hidden="true" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-5">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2">
                Filtros <PendingIcon />
              </SheetTitle>
            </SheetHeader>
            <FiltersForm {...props} idPrefix="mob" />
            <div className="mt-2 flex gap-2">
              {activeCount > 0 && (
                <Button type="button" variant="secondary" className="flex-1" onClick={clear}>
                  Limpar
                </Button>
              )}
              <SheetClose render={<Button className="flex-1" />}>Ver cupcakes</SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
