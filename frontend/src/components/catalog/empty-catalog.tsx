"use client"

import { useCatalogState } from "@/components/catalog/catalog-state"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { Button } from "@/components/ui/button"

export function EmptyCatalog() {
  const { clear } = useCatalogState()

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-12 text-center shadow-soft">
      <CupcakeIllustration className="size-28" />
      <h2 className="text-2xl font-semibold">Nenhum cupcake por aqui</h2>
      <p className="text-muted-foreground">Nada combina com esses filtros. Que tal tentar outra busca?</p>
      <Button type="button" onClick={clear}>
        Limpar filtros
      </Button>
    </div>
  )
}
