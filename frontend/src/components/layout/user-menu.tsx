"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSession } from "@/stores/session"

export function UserMenu() {
  const hydrated = useHydrated()
  const user = useSession((s) => s.user)
  const token = useSession((s) => s.token)
  const router = useRouter()

  // Estado neutro até a hidratação, para não divergir do HTML do servidor.
  if (!hydrated) {
    return <span className="inline-block h-10 w-20" aria-hidden="true" />
  }

  if (!token) {
    return (
      <Link href="/entrar" className={buttonVariants({ variant: "secondary", size: "sm" })}>
        Entrar
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        <User aria-hidden="true" />
        <span className="max-w-28 truncate">{user?.name ?? "Minha conta"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/pedidos")}>Meus pedidos</DropdownMenuItem>
        {user?.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>Administração</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            useSession.getState().clear()
            router.push("/")
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
