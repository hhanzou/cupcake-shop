import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ApiError } from "@/lib/api"
import { imageUrl } from "@/lib/image-url"
import { formatPrice } from "@/lib/money"
import { getProduct } from "@/lib/services/products"
import type { Product } from "@/lib/types"

async function loadProduct(id: string): Promise<Product> {
  try {
    return await getProduct(id, "no-store")
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProduct(id, "no-store")
    return {
      title: product.name,
      description: product.description ?? `Cupcake de ${product.flavor} da CupcakeShop.`,
    }
  } catch {
    return { title: "Cupcake" }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await loadProduct(id)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-secondary shadow-soft">
          <Image
            src={imageUrl(product.imageUrl, product.updatedAt)}
            alt={product.name}
            fill
            unoptimized
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold">{product.name}</h1>
          <p className="text-muted-foreground">Sabor: {product.flavor}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Categorias">
            {product.categories.map((category, i) => (
              <li key={category.id}>
                <Badge className={`${["bg-mint", "bg-lilac", "bg-butter"][i % 3]} text-foreground`}>
                  {category.name}
                </Badge>
              </li>
            ))}
          </ul>
          {product.description && <p className="text-base leading-relaxed">{product.description}</p>}
          <p className="w-fit rounded-full bg-butter px-5 py-2 font-heading text-2xl font-semibold shadow-soft">
            {formatPrice(product.price)}
          </p>
          {/* O botão de adicionar ao carrinho entra na Fase 5 */}
        </div>
      </div>
    </div>
  )
}
