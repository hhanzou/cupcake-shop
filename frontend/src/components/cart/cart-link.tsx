"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ShoppingBasket } from "lucide-react"
import { useHydrated } from "@/hooks/use-hydrated"
import { useCart } from "@/stores/cart"

export function CartLink() {
  const hydrated = useHydrated()
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const [hop, setHop] = useState(false)
  const previous = useRef(count)

  useEffect(() => {
    if (hydrated && count > previous.current) {
      setHop(true)
      const t = setTimeout(() => setHop(false), 600)
      previous.current = count
      return () => clearTimeout(t)
    }
    previous.current = count
  }, [count, hydrated])

  return (
    <Link href="/carrinho" className="flex items-center gap-1.5">
      <span className={hop ? "animate-hop" : undefined}>
        <ShoppingBasket className="size-5" aria-hidden="true" />
      </span>
      Carrinho
      {hydrated && count > 0 && (
        <span
          className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold"
          aria-label={`${count} ${count === 1 ? "item" : "itens"} no carrinho`}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
