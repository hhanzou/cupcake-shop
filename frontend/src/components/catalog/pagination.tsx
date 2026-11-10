"use client"

import Link from "next/link"
import { useCatalogState } from "@/components/catalog/catalog-state"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Paginação do catálogo. Os links funcionam normalmente (abrir em nova aba etc.), mas o clique
 * passa pelo estado do catálogo para mostrar o carregamento e rolar até o topo da lista.
 */
export function Pagination({ page, total, limit }: { page: number; total: number; limit: number }) {
  const { params, navigate, hrefFor } = useCatalogState()
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  const current = Math.min(page, totalPages)
  const href = (target: number) => hrefFor({ ...params, page: target > 1 ? String(target) : undefined })

  const go = (target: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate({ page: target > 1 ? String(target) : undefined }, { keepPage: true, scroll: true })
  }

  const disabled = cn(buttonVariants({ variant: "secondary" }), "pointer-events-none opacity-50")

  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-3">
      {current > 1 ? (
        <Link href={href(current - 1)} onClick={go(current - 1)} className={buttonVariants({ variant: "secondary" })}>
          Anterior
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          Anterior
        </span>
      )}
      <span className="text-sm" aria-current="page">
        Página {current} de {totalPages}
      </span>
      {current < totalPages ? (
        <Link href={href(current + 1)} onClick={go(current + 1)} className={buttonVariants({ variant: "secondary" })}>
          Próxima
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          Próxima
        </span>
      )}
    </nav>
  )
}
