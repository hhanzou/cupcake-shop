"use client"

import { useEffect } from "react"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { Button } from "@/components/ui/button"

export default function LojaError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <CupcakeIllustration className="size-28" />
      <h1 className="text-2xl font-semibold">Ops, o forno deu uma travadinha</h1>
      <p className="text-muted-foreground">Não conseguimos carregar esta página agora.</p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </div>
  )
}
