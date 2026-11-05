import type { Metadata } from "next"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
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
      <section className="hero-sprinkles relative overflow-hidden rounded-3xl border border-secondary bg-secondary/60 px-6 py-8 shadow-soft sm:px-10">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <CupcakeIllustration className="animate-float size-28 shrink-0 sm:size-36" />
          <div className="animate-fade-up">
            <p className="mb-1 inline-block rounded-full bg-butter px-3 py-1 text-sm font-semibold">Feitos no dia, com carinho</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">Nossos cupcakes</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Escolha seus sabores, agende o dia e a gente cuida do resto: retire na loja ou receba em casa.
            </p>
          </div>
        </div>
        <span aria-hidden="true" className="animate-twinkle absolute top-6 right-8 size-3 rounded-full bg-lilac" />
        <span aria-hidden="true" className="animate-twinkle absolute right-24 bottom-8 size-2.5 rounded-full bg-mint [animation-delay:1s]" />
        <span aria-hidden="true" className="animate-twinkle absolute top-1/2 right-1/3 size-2 rounded-full bg-butter [animation-delay:1.8s]" />
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
                {products.data.map((product, i) => (
                  <li key={product.id} className="stagger flex" style={{ ["--i" as string]: i }}>
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
