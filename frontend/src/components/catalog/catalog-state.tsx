"use client"

import { createContext, useContext, useMemo, useOptimistic, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export const FILTER_KEYS = ["q", "category", "flavor", "minPrice", "maxPrice", "sort"] as const
export type FilterKey = (typeof FILTER_KEYS)[number]
type Params = Partial<Record<FilterKey | "page", string>>

type CatalogState = {
  /** Filtros como o usuário acabou de escolher (otimistas), antes mesmo da página nova chegar. */
  params: Params
  /** true enquanto a página com os novos filtros está sendo buscada. */
  isPending: boolean
  /** Aplica mudanças nos filtros. Por padrão volta para a página 1 e não rola a tela. */
  navigate: (changes: Params, options?: { keepPage?: boolean; scroll?: boolean }) => void
  clear: () => void
  hrefFor: (params: Params) => string
}

const CatalogContext = createContext<CatalogState | null>(null)

function toParams(search: URLSearchParams): Params {
  const params: Params = {}
  for (const key of [...FILTER_KEYS, "page"] as const) {
    const value = search.get(key)
    if (value) params[key] = value
  }
  return params
}

export function CatalogStateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const current = useMemo(() => toParams(new URLSearchParams(queryString)), [queryString])

  const [params, setOptimistic] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  const value = useMemo<CatalogState>(() => {
    const hrefFor = (next: Params) => {
      const search = new URLSearchParams()
      for (const [key, v] of Object.entries(next)) if (v) search.set(key, v)
      const qs = search.toString()
      return qs ? `${pathname}?${qs}` : pathname
    }

    const go = (next: Params, scroll: boolean) => {
      startTransition(() => {
        setOptimistic(next)
        router.push(hrefFor(next), { scroll })
      })
    }

    return {
      params,
      isPending,
      hrefFor,
      navigate: (changes, { keepPage = false, scroll = false } = {}) => {
        // Parte do estado otimista: várias escolhas rápidas se acumulam em vez de se perderem.
        const next: Params = { ...params }
        for (const [key, v] of Object.entries(changes) as [keyof Params, string | undefined][]) {
          if (v) next[key] = v
          else delete next[key]
        }
        if (!keepPage) delete next.page
        go(next, scroll)
      },
      clear: () => go({}, false),
    }
  }, [params, isPending, pathname, router, setOptimistic])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalogState() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error("useCatalogState precisa estar dentro de <CatalogStateProvider>")
  return context
}
