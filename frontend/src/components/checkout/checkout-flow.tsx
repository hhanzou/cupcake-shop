"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AuthDialog } from "@/components/checkout/auth-dialog"
import {
  ADDRESS_FIELDS,
  checkoutSchema,
  DEFAULT_VALUES,
  type CheckoutValues,
} from "@/components/checkout/checkout-schema"
import { StepDelivery } from "@/components/checkout/step-delivery"
import { StepPayment } from "@/components/checkout/step-payment"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { ApiError } from "@/lib/api"
import { getFieldDetails } from "@/lib/form-errors"
import { previewCart } from "@/lib/services/cart"
import { createOrder } from "@/lib/services/orders"
import { useCart } from "@/stores/cart"
import { useSession } from "@/stores/session"

const PAYMENT_DELAY_MS = 2000
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function CheckoutFlow() {
  const hydrated = useHydrated()
  const router = useRouter()
  const items = useCart((s) => s.items)

  const [step, setStep] = useState<1 | 2>(1)
  const [processing, setProcessing] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const submitting = useRef(false)
  const [completed, setCompleted] = useState(false)

  const methods = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Mesma chave do carrinho: reaproveita o cache do SWR.
  const key = items.length ? ["cart-preview", items.map((i) => `${i.productId}:${i.quantity}`).join(",")] : null
  const { data: preview, error: previewError, mutate } = useSWR(
    key,
    () => previewCart(items.map(({ productId, quantity }) => ({ productId, quantity }))),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const hasUnavailable = !!preview && preview.unavailableProductIds.length > 0
  const mustLeave = hydrated && !completed && (items.length === 0 || hasUnavailable)

  useEffect(() => {
    if (mustLeave) router.replace("/carrinho")
  }, [mustLeave, router])

  async function goToPayment() {
    const valid = await methods.trigger()
    if (valid) {
      setStep(2)
      window.scrollTo({ top: 0 })
    }
  }

  function backToDelivery() {
    setStep(1)
    window.scrollTo({ top: 0 })
  }

  async function pay() {
    if (submitting.current) return
    if (!useSession.getState().token) {
      setAuthOpen(true)
      return
    }

    submitting.current = true
    setProcessing(true)
    try {
      await sleep(PAYMENT_DELAY_MS)
      const values = methods.getValues()
      const a = values.address
      const order = await createOrder({
        fulfillmentType: values.fulfillmentType,
        scheduledDate: values.scheduledDate,
        items: useCart.getState().items.map(({ productId, quantity }) => ({ productId, quantity })),
        // Em retirada o campo `address` não é enviado, nem vazio.
        ...(values.fulfillmentType === "DELIVERY" && {
          address: {
            street: a.street.trim(),
            number: a.number.trim(),
            ...(a.complement.trim() && { complement: a.complement.trim() }),
            district: a.district.trim(),
            city: a.city.trim(),
            state: a.state.trim().toUpperCase(),
            zipCode: a.zipCode.replace(/\D/g, ""),
          },
        }),
      })
      setCompleted(true)
      useCart.getState().clear()
      router.push(`/pedidos/${order.id}?novo=1`)
    } catch (error) {
      submitting.current = false
      setProcessing(false)
      handleOrderError(error)
    }
  }

  function handleOrderError(error: unknown) {
    if (!(error instanceof ApiError)) {
      toast.error("Não foi possível concluir o pedido. Tente novamente.")
      return
    }
    if (error.status === 401) {
      toast.warning("Sua sessão expirou. Entre novamente para finalizar.")
      setAuthOpen(true)
      return
    }
    if (error.code === "ORDER_ITEM_UNAVAILABLE") {
      toast.error("Alguns cupcakes não estão mais disponíveis.")
      router.push("/carrinho")
      return
    }
    if (error.code === "ORDER_INVALID_DATE") {
      methods.setError("scheduledDate", { type: "server", message: error.message })
      toast.error(error.message)
      setStep(1)
      return
    }
    if (error.code === "ORDER_INVALID_ADDRESS") {
      for (const { path, message } of getFieldDetails(error)) {
        const field = path.replace(/^address\./, "")
        if ((ADDRESS_FIELDS as readonly string[]).includes(field)) {
          methods.setError(`address.${field}` as `address.${(typeof ADDRESS_FIELDS)[number]}`, { type: "server", message })
        }
      }
      toast.error(error.message)
      setStep(1)
      return
    }
    toast.error(error.message)
  }

  if (!hydrated || mustLeave) {
    return <Skeleton role="status" aria-label="Carregando" className="h-96 rounded-3xl" />
  }

  return (
    <FormProvider {...methods}>
      <ol className="mb-6 flex gap-3 text-sm font-semibold" aria-label="Etapas do checkout">
        <li aria-current={step === 1 ? "step" : undefined} className={`rounded-full px-4 py-1.5 ${step === 1 ? "bg-primary" : "bg-secondary"}`}>
          1. Entrega
        </li>
        <li aria-current={step === 2 ? "step" : undefined} className={`rounded-full px-4 py-1.5 ${step === 2 ? "bg-primary" : "bg-secondary"}`}>
          2. Pagamento
        </li>
      </ol>

      {previewError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Não foi possível conferir os valores do carrinho.</span>
          <Button size="sm" variant="secondary" onClick={() => mutate()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {step === 1 ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void goToPayment()
          }}
          className="flex flex-col gap-6"
        >
          <StepDelivery />
          <Button type="submit" size="lg">
            Continuar para o pagamento
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <StepPayment preview={preview} processing={processing} onPay={() => void pay()} />
          <Button type="button" variant="ghost" onClick={backToDelivery} disabled={processing}>
            Voltar para a entrega
          </Button>
        </div>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => {
          setAuthOpen(false)
          void pay()
        }}
      />
    </FormProvider>
  )
}
