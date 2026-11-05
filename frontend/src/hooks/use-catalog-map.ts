"use client"

import useSWR from "swr"
import { listProducts } from "@/lib/services/products"
import type { Product } from "@/lib/types"

/**
 * Cupcakes ativos por id. Usado para mostrar fotos nos pedidos e saber o que ainda
 * pode ser pedido de novo. Item ausente do mapa = não está mais à venda.
 */
export function useCatalogMap() {
  const { data, isLoading } = useSWR("catalog-map", () => listProducts({ limit: 50 }, "no-store"), {
    revalidateOnFocus: false,
  })
  const map = new Map<string, Product>((data?.data ?? []).map((p) => [p.id, p]))
  return { map, ready: !isLoading && !!data }
}
