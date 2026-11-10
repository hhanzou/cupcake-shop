"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Field } from "@/components/auth/field"
import { PasswordChecklist } from "@/components/auth/password-checklist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { applyFieldErrors } from "@/lib/form-errors"
import { isStrongPassword, PASSWORD_MAX } from "@/lib/password"
import { register as registerUser } from "@/lib/services/auth"
import { useSession } from "@/stores/session"

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(120, "Nome muito longo"),
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z
    .string()
    .min(1, "Crie uma senha")
    .max(PASSWORD_MAX, `A senha pode ter no máximo ${PASSWORD_MAX} caracteres`)
    .refine(isStrongPassword, "A senha ainda não cumpre todas as exigências"),
})
type Values = z.infer<typeof schema>

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } })
  const password = useWatch({ control, name: "password" })

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      const session = await registerUser(values)
      useSession.getState().setSession(session)
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_IN_USE") {
        setError("email", { type: "server", message: error.message })
      } else if (!applyFieldErrors(error, setError, ["name", "email", "password"])) {
        setFormError(error instanceof ApiError ? error.message : "Não foi possível criar a conta. Tente novamente.")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field id="register-name" label="Nome" error={errors.name?.message}>
        <Input
          id="register-name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          {...register("name")}
        />
      </Field>
      <Field id="register-email" label="E-mail" error={errors.email?.message}>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <Field id="register-password" label="Senha" error={errors.password?.message}>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "register-password-rules register-password-error" : "register-password-rules"}
          {...register("password")}
        />
      </Field>
      <PasswordChecklist id="register-password-rules" password={password} />
      {formError && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  )
}
