"use client"

import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { FULFILLMENT_LABEL } from "@/lib/labels"
import { formatPrice } from "@/lib/money"
import { formatDate } from "@/lib/schedule"
import { STORE } from "@/lib/store"
import type { CartPreview } from "@/lib/types"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

export function StepPayment({
  preview,
  processing,
  onPay,
}: {
  preview: CartPreview | undefined
  processing: boolean
  onPay: () => void
}) {
  const { getValues } = useFormContext<CheckoutValues>()
  const values = getValues()
  const a = values.address

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="resumo-titulo" className="rounded-3xl border border-secondary bg-card p-5 shadow-soft">
        <h2 id="resumo-titulo" className="mb-3 text-lg font-semibold">
          Resumo do pedido
        </h2>
        <ul className="divide-y divide-secondary">
          {preview?.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3 py-2">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-baseline justify-between border-t border-secondary pt-3">
          <span>Total</span>
          <span className="font-heading text-2xl font-semibold">{preview ? formatPrice(preview.total) : "—"}</span>
        </p>
        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold">Recebimento:</dt>
            <dd>{FULFILLMENT_LABEL[values.fulfillmentType]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Data:</dt>
            <dd>{formatDate(values.scheduledDate)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{values.fulfillmentType === "DELIVERY" ? "Endereço:" : "Local:"}</dt>
            <dd>
              {values.fulfillmentType === "DELIVERY"
                ? `${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""}, ${a.district}, ${a.city} - ${a.state.toUpperCase()}, CEP ${a.zipCode}`
                : `${STORE.address} (${STORE.hours})`}
            </dd>
          </div>
        </dl>
      </section>

      <p className="rounded-2xl bg-lilac px-4 py-3 text-sm font-semibold" role="note">
        Pagamento simulado: nenhum dado de cartão é pedido e nenhuma cobrança real é feita.
      </p>

      <Button type="button" size="lg" onClick={onPay} disabled={processing || !preview}>
        {processing ? "Processando pagamento..." : "Simular pagamento"}
      </Button>
    </div>
  )
}
