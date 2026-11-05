import type { Metadata } from "next"
import { EmptyCatalog } from "@/components/catalog/empty-catalog"
import { CatalogFilters } from "@/components/catalog/catalog-filters"
import { Pagination } from "@/components/catalog/pagination"
import { ProductCard } from "@/components/catalog/product-card"
import { parseCatalogParams } from "@/lib/catalog-params"
import { listCategories } from "@/lib/services/categories"
import { listProducts } from "@/lib/services/products"

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Veja todos os cupcakes da CupcakeShop, filtre por sabor, categoria e preço.",
}

const LIMIT = 12

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = parseCatalogParams(await searchParams)

  const [products, categories, allProducts] = await Promise.all([
    listProducts(
      {
        q: params.q,
        flavor: params.flavor,
        category: params.category,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        sort: params.sort,
        page: params.page,
        limit: LIMIT,
      },
      "no-store",
    ),
    listCategories("no-store"),
    listProducts({ limit: 50 }, "no-store"),
  ])

  const flavors = [...new Set(allProducts.data.map((p) => p.flavor))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="text-center">
        <h1 className="text-4xl font-semibold">Nossos cupcakes</h1>
        <p className="mt-1 text-muted-foreground">Fresquinhos, feitos com carinho e agendados para o seu dia.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CatalogFilters categories={categories.data} flavors={flavors} />
        <div>
          {products.data.length === 0 ? (
            <EmptyCatalog />
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
                {products.total} {products.total === 1 ? "cupcake encontrado" : "cupcakes encontrados"}
              </p>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.data.map((product) => (
                  <li key={product.id} className="flex">
                    <div className="flex w-full flex-col">
                      <ProductCard product={product} />
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination params={params} total={products.total} limit={LIMIT} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
