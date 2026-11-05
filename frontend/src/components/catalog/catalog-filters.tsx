"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toApiPrice } from "@/lib/money"
import type { Category } from "@/lib/types"

type Props = {
  categories: Category[]
  flavors: string[]
}

function FiltersForm({ categories, flavors, idPrefix }: Props & { idPrefix: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "")
  const [priceError, setPriceError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete("page")
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function onSearch(value: string) {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ q: value.trim() || null }), 300)
  }

  function applyPrices() {
    const min = minPrice.trim() ? toApiPrice(minPrice) : null
    const max = maxPrice.trim() ? toApiPrice(maxPrice) : null
    if ((minPrice.trim() && !min) || (maxPrice.trim() && !max)) {
      setPriceError("Use valores como 12,50")
      return
    }
    setPriceError(null)
    update({ minPrice: min, maxPrice: max })
  }

  const hasFilters = ["q", "flavor", "category", "minPrice", "maxPrice", "sort"].some((k) => searchParams.has(k))

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
          value={searchParams.get("category") ?? ""}
          onChange={(e) => update({ category: e.target.value || null })}
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
          value={searchParams.get("flavor") ?? ""}
          onChange={(e) => update({ flavor: e.target.value || null })}
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
        {priceError && (
          <p role="alert" className="text-sm text-destructive">
            {priceError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>Ordenar por</Label>
        <NativeSelect
          id={`${idPrefix}-sort`}
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => update({ sort: e.target.value || null })}
        >
          <option value="">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </NativeSelect>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setQ("")
            setMinPrice("")
            setMaxPrice("")
            router.push(pathname)
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}

export function CatalogFilters(props: Props) {
  const searchParams = useSearchParams()
  // A chave refaz o formulário quando a URL muda por fora (botão voltar, limpar).
  const key = searchParams.toString()

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-4 rounded-3xl border border-secondary bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
          <FiltersForm key={key} {...props} idPrefix="desk" />
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="secondary" />}>
            <SlidersHorizontal aria-hidden="true" />
            Filtros
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-5">
            <SheetHeader className="p-0">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <FiltersForm key={key} {...props} idPrefix="mob" />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
