import Link from "next/link"
import { CartLink } from "@/components/cart/cart-link"
import { UserMenu } from "@/components/layout/user-menu"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { STORE } from "@/lib/store"

export function SiteHeader() {
  return (
    <header>
      <div className="awning h-5" aria-hidden="true" />
      <div className="awning-edge" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="hover-wiggle flex items-center gap-2 font-heading text-2xl font-semibold">
          <CupcakeIllustration className="size-9" title="" />
          {STORE.name}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          <Link href="/">Catálogo</Link>
          <CartLink />
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
