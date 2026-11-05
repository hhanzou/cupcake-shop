import Image from "next/image"
import { imageUrl } from "@/lib/image-url"
import type { PricedItem, Product } from "@/lib/types"

const MAX = 4

/** Fotinhas sobrepostas dos cupcakes do pedido, com "+N" quando passam de 4. */
export function OrderThumbs({ items, catalog }: { items: PricedItem[]; catalog: Map<string, Product> }) {
  const shown = items.slice(0, MAX)
  const extra = items.length - shown.length

  return (
    <div className="flex items-center" role="img" aria-label={`Cupcakes do pedido: ${items.map((i) => `${i.quantity} ${i.name}`).join(", ")}`}>
      {shown.map((item, i) => (
        <span
          key={item.productId}
          className="relative -ml-3 size-14 overflow-hidden rounded-full border-2 border-card bg-secondary first:ml-0"
          style={{ zIndex: MAX - i }}
        >
          <Image
            src={imageUrl(catalog.get(item.productId)?.imageUrl)}
            alt=""
            fill
            unoptimized
            sizes="56px"
            className="object-cover"
          />
          {item.quantity > 1 && (
            <span className="absolute right-0 bottom-0 rounded-full bg-butter px-1.5 text-[10px] font-bold leading-4">×{item.quantity}</span>
          )}
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-3 grid size-14 place-items-center rounded-full border-2 border-card bg-lilac text-sm font-bold">+{extra}</span>
      )}
    </div>
  )
}
