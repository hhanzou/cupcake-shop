"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

const LINKS = [
  { href: "/admin/cupcakes", label: "Cupcakes" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/pedidos", label: "Pedidos" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const token = useSession((s) => s.token)
  const role = useSession((s) => s.user?.role)
  const router = useRouter()
  const pathname = usePathname()

  const allowed = hydrated && !!token && role === "ADMIN"

  // Proteção só de experiência de uso: quem protege os dados é a API.
  useEffect(() => {
    if (!hydrated) return
    if (!token) router.replace(`/entrar?next=${encodeURIComponent(pathname)}`)
    else if (role !== "ADMIN") router.replace("/")
  }, [hydrated, token, role, router, pathname])

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Skeleton role="status" aria-label="Carregando" className="h-64 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary pb-4">
        <div className="flex items-center gap-6">
          <span className="font-heading text-2xl font-semibold">Administração</span>
          <nav aria-label="Administração" className="flex gap-1">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("rounded-full px-4 py-1.5 text-sm font-semibold", active ? "bg-primary" : "hover:bg-secondary")}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <Link href="/" className="text-sm font-medium underline">
          Voltar à loja
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
