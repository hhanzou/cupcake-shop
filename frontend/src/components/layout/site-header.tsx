import Link from "next/link"
import { CartLink } from "@/components/cart/cart-link"
import { UserMenu } from "@/components/layout/user-menu"
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
          <CartLink />
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
