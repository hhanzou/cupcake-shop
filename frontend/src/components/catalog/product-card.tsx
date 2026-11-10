import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { InCartBadge } from "@/components/cart/in-cart-badge"
import { imageUrl } from "@/lib/image-url"
import { formatPrice } from "@/lib/money"
import type { Product } from "@/lib/types"

const BADGE_COLORS = ["bg-mint", "bg-lilac", "bg-butter"]

/*
 * Raios concêntricos (regra dos "nested border radius"): raio interno = raio externo − espaçamento.
 * Card com 28px de raio e 8px de respiro → foto, área de foco e botão com 20px.
 * O botão tem 40px de altura (h-10), então a pílula dele também tem 20px de raio.
 * Os selos sobre a foto têm 24px de altura (raio 12px) e ficam a 8px da borda: 20 − 8 = 12.
 */
const CARD = "[--card-radius:1.75rem] [--card-pad:0.5rem]"
const OUTER = "rounded-[var(--card-radius)] p-[var(--card-pad)]"
const INNER = "rounded-[calc(var(--card-radius)_-_var(--card-pad))]"

export function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className={`${CARD} ${OUTER} group/card flex flex-col gap-[var(--card-pad)] border border-secondary bg-card shadow-soft transition-transform duration-200 hover:-translate-y-1`}
    >
      <Link
        href={`/cupcakes/${product.id}`}
        className={`${INNER} flex flex-1 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
      >
        <div className={`${INNER} relative isolate aspect-[9/10] w-full overflow-hidden bg-secondary`}>
          <Image
            src={imageUrl(product.imageUrl)}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
          <InCartBadge productId={product.id} className="absolute top-2 left-2" />
          <span className="absolute right-2 bottom-2 -rotate-3 rounded-full border border-white/70 bg-butter px-3 py-1 font-heading text-sm font-semibold shadow-soft">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-2 pt-3 pb-1">
          <h2 className="text-lg leading-tight font-semibold transition-colors group-hover/card:text-primary">{product.name}</h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description ?? `Sabor: ${product.flavor}`}</p>
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
      <AddToCartButton product={product} className={`${INNER} w-full`} />
    </article>
  )
}
