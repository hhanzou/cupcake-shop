"use client"

import { LoaderCircle } from "lucide-react"
import { useCatalogState } from "@/components/catalog/catalog-state"
import { cn } from "@/lib/utils"

/**
 * Envolve a lista de cupcakes. Enquanto os novos filtros carregam, mantém os resultados
 * anteriores na tela, esmaecidos, com uma barra de progresso e um aviso de "buscando".
 */
export function CatalogResults({ children }: { children: React.ReactNode }) {
  const { isPending } = useCatalogState()

  return (
    <div className="relative" aria-busy={isPending}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-3 h-1 overflow-hidden rounded-full bg-secondary transition-opacity duration-200",
          isPending ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="animate-progress h-full w-1/3 rounded-full bg-primary" />
      </div>

      {isPending && (
        <div className="pointer-events-none sticky top-4 z-20 flex h-0 justify-center">
          <p
            role="status"
            className="animate-pop mt-16 inline-flex h-fit items-center gap-2 rounded-full border border-secondary bg-card px-4 py-2 text-sm font-semibold shadow-soft"
          >
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
            Buscando cupcakes...
          </p>
        </div>
      )}

      <div
        className={cn(
          "transition-[opacity,filter] duration-200",
          isPending && "pointer-events-none opacity-50 saturate-50 motion-reduce:opacity-60",
        )}
      >
        {children}
      </div>
    </div>
  )
}
