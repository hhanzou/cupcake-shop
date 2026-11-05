"use client"

import Link from "next/link"
import useSWR from "swr"
import { ProductForm } from "@/components/admin/product-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { getProduct } from "@/lib/services/products"

export function ProductEditor({ id }: { id: string }) {
  const { data, error, isLoading, mutate } = useSWR(["admin-product", id], () => getProduct(id, "no-store"), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  if (isLoading) return <Skeleton role="status" aria-label="Carregando cupcake" className="h-96 rounded-3xl" />

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-12 text-center">
        <p>{notFound ? "Cupcake não encontrado ou já excluído." : "Não foi possível carregar o cupcake."}</p>
        {notFound ? (
          <Link href="/admin/cupcakes" className="font-semibold underline">
            Voltar à lista
          </Link>
        ) : (
          <Button onClick={() => mutate()}>Tentar de novo</Button>
        )}
      </div>
    )
  }

  return <ProductForm product={data} />
}
