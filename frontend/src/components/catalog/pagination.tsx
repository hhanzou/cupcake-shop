import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { buildCatalogQuery, type CatalogParams } from "@/lib/catalog-params"
import { cn } from "@/lib/utils"

export function Pagination({
  params,
  total,
  limit,
  basePath = "/",
}: {
  params: CatalogParams
  total: number
  limit: number
  basePath?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  const href = (page: number) => {
    const qs = buildCatalogQuery({ ...params, page })
    return qs ? `${basePath}?${qs}` : basePath
  }
  const current = Math.min(params.page, totalPages)

  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-3">
      {current > 1 ? (
        <Link href={href(current - 1)} className={buttonVariants({ variant: "secondary" })}>
          Anterior
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "secondary" }), "pointer-events-none opacity-50")} aria-disabled="true">
          Anterior
        </span>
      )}
      <span className="text-sm" aria-current="page">
        Página {current} de {totalPages}
      </span>
      {current < totalPages ? (
        <Link href={href(current + 1)} className={buttonVariants({ variant: "secondary" })}>
          Próxima
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "secondary" }), "pointer-events-none opacity-50")} aria-disabled="true">
          Próxima
        </span>
      )}
    </nav>
  )
}
