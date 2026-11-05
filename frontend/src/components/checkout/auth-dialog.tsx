"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Entre para finalizar" : "Crie sua conta para finalizar"}</DialogTitle>
          <DialogDescription>Seus dados do pedido ficam guardados enquanto você entra.</DialogDescription>
        </DialogHeader>
        {mode === "login" ? <LoginForm onSuccess={onSuccess} /> : <RegisterForm onSuccess={onSuccess} />}
        <Button type="button" variant="ghost" size="sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
