"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSession } from "@/stores/session"

/**
 * Redireciona para /entrar?next=<rota> quando não há sessão.
 * Retorna `ready` (sessão confirmada) e `hydrated` (já leu o localStorage).
 */
export function useRequireAuth() {
  const hydrated = useHydrated()
  const token = useSession((s) => s.token)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (hydrated && !token) {
      const search = typeof window !== "undefined" ? window.location.search : ""
      router.replace(`/entrar?next=${encodeURIComponent(pathname + search)}`)
    }
  }, [hydrated, token, router, pathname])

  return { hydrated, ready: hydrated && !!token }
}
