"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { safeNext } from "@/lib/safe-next"

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const target = safeNext(next)
  const suffix = next ? `?next=${encodeURIComponent(next)}` : ""

  const onSuccess = () => router.replace(target)

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-secondary bg-card p-6 shadow-soft">
      <h1 className="mb-1 text-3xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {mode === "login" ? "Acesse sua conta para acompanhar seus pedidos." : "Leva menos de um minuto."}
      </p>
      {mode === "login" ? <LoginForm onSuccess={onSuccess} /> : <RegisterForm onSuccess={onSuccess} />}
      <p className="mt-5 text-center text-sm">
        {mode === "login" ? (
          <>
            Ainda não tem conta?{" "}
            <Link href={`/cadastro${suffix}`} className="font-semibold underline">
              Cadastre-se
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href={`/entrar${suffix}`} className="font-semibold underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
