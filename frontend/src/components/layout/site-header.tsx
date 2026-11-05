import Link from "next/link"
import { ShoppingBasket } from "lucide-react"
import { STORE } from "@/lib/store"

export function SiteHeader() {
  return (
    <header>
      <div className="awning h-5" aria-hidden="true" />
      <div className="awning-edge" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-2xl font-semibold">
          {STORE.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/">Catálogo</Link>
          <Link href="/carrinho" className="flex items-center gap-1">
            <ShoppingBasket className="size-5" aria-hidden="true" />
            Carrinho
          </Link>
        </nav>
      </div>
    </header>
  )
}
