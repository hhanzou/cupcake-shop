'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/stores/cart'
import { useSession } from '@/stores/session'

let hydration: Promise<unknown> | null = null

function hydrateStores() {
  hydration ??= Promise.all([useSession.persist.rehydrate(), useCart.persist.rehydrate()])
  return hydration
}

/**
 * Reidrata as stores persistidas (localStorage) após a montagem.
 * Retorna false até lá, para o servidor e o primeiro render do cliente coincidirem.
 */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    hydrateStores().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
