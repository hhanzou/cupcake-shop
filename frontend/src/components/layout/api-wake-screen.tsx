"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { Button } from "@/components/ui/button"
import { request } from "@/lib/api"

const POLL_TIMEOUT_MS = 60_000
const RETRY_PAUSE_MS = 2_000
const SETTLE_MS = 4_000
const MAX_WAIT_MS = 3 * 60_000
const MAX_REFRESHES = 5

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Tela exibida quando a API não respondeu a tempo (cold start do Render).
 * Chama GET /categories (acorda também o banco) até a API responder e então
 * refaz os Server Components com router.refresh().
 */
export function ApiWakeScreen() {
  const router = useRouter()
  const [round, setRound] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (failed) return
    let cancelled = false
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)

    async function run() {
      let refreshes = 0
      while (!cancelled) {
        if (Date.now() - started > MAX_WAIT_MS || refreshes >= MAX_REFRESHES) {
          setFailed(true)
          return
        }
        try {
          await request("/categories", { timeoutMs: POLL_TIMEOUT_MS, quiet: true, cache: "no-store" })
        } catch {
          await sleep(RETRY_PAUSE_MS)
          continue
        }
        if (cancelled) return
        refreshes++
        router.refresh()
        // Se a página real renderizar, este componente é desmontado e o loop termina.
        await sleep(SETTLE_MS)
      }
    }
    void run()

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [failed, round, router])

  function retry() {
    setSeconds(0)
    setFailed(false)
    setRound((r) => r + 1)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <CupcakeIllustration className={failed ? "size-32" : "animate-float size-32"} />
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
        {failed ? (
          <>
            <h1 className="text-2xl font-semibold">A confeitaria não respondeu</h1>
            <p className="max-w-md text-muted-foreground">
              Não conseguimos falar com o servidor agora. Tente de novo em instantes.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Acordando a confeitaria...</h1>
            <p className="max-w-md text-muted-foreground">
              O servidor estava descansando e pode levar até 1 minuto para ficar pronto. Já já os cupcakes aparecem!
            </p>
          </>
        )}
      </div>
      {!failed && (
        <p aria-hidden="true" className="rounded-full bg-butter px-4 py-1 font-heading text-lg font-semibold tabular-nums">
          {seconds}s
        </p>
      )}
      <Button onClick={failed ? retry : () => router.refresh()}>{failed ? "Tentar de novo" : "Tentar agora"}</Button>
    </div>
  )
}
