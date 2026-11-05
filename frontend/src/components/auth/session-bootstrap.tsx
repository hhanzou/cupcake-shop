"use client"

import { useEffect } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { ApiError } from "@/lib/api"
import { getMe } from "@/lib/services/auth"
import { useSession } from "@/stores/session"

/** Ao abrir o site, confirma o token salvo com GET /auth/me. Token expirado limpa a sessão. */
export function SessionBootstrap() {
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated || !useSession.getState().token) return
    let cancelled = false
    getMe()
      .then(({ user }) => {
        if (!cancelled) useSession.getState().setUser(user)
      })
      .catch((error) => {
        // 401 já limpa a sessão em authRequest; erros de rede mantêm o token salvo.
        if (error instanceof ApiError && error.status === 401) useSession.getState().clear()
      })
    return () => {
      cancelled = true
    }
  }, [hydrated])

  return null
}
