import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { imageUrl } from "@/lib/image-url"
import { formatPrice } from "@/lib/money"
import type { Product } from "@/lib/types"

const BADGE_COLORS = ["bg-mint", "bg-lilac", "bg-butter"]

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group/card flex flex-col overflow-hidden rounded-3xl border border-secondary bg-card shadow-soft transition-transform duration-200 hover:-translate-y-1">
      <Link href={`/cupcakes/${product.id}`} className="flex flex-1 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <div className="relative aspect-[9/10] w-full overflow-hidden">
          <Image
            src={imageUrl(product.imageUrl)}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
          <span className="absolute right-3 bottom-3 -rotate-3 rounded-full border border-white/70 bg-butter px-3 py-1 font-heading text-sm font-semibold shadow-soft">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h2 className="text-lg leading-tight font-semibold transition-colors group-hover/card:text-[#d6345a]">{product.name}</h2>
          <p className="text-sm text-muted-foreground">Sabor: {product.flavor}</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Categorias">
            {product.categories.map((category, i) => (
              <li key={category.id}>
                <Badge className={`${BADGE_COLORS[i % BADGE_COLORS.length]} text-foreground`}>
                  {category.name}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <AddToCartButton product={product} className="w-full" />
      </div>
    </article>
  )
}
