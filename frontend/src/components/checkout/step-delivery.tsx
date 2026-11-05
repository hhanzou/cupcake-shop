"use client"

import { Controller, useFormContext } from "react-hook-form"
import { ptBR } from "react-day-picker/locale"
import { Field } from "@/components/auth/field"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FULFILLMENT_LABEL } from "@/lib/labels"
import { getAvailableDates, isoToLocalDate, localDateToIso } from "@/lib/schedule"
import { STORE } from "@/lib/store"
import type { CheckoutValues } from "@/components/checkout/checkout-schema"

export function StepDelivery() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<CheckoutValues>()
  const fulfillmentType = watch("fulfillmentType")
  const available = getAvailableDates()
  const availableSet = new Set(available)
  const addressErrors = errors.address

  function addressInput(name: "street" | "number" | "complement" | "district" | "city" | "state" | "zipCode", props: React.ComponentProps<typeof Input> = {}) {
    const error = addressErrors?.[name]?.message
    return (
      <Input
        id={`address-${name}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `address-${name}-error` : undefined}
        {...props}
        {...register(`address.${name}`)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-semibold">Como você quer receber?</legend>
        <Controller
          control={control}
          name="fulfillmentType"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="sm:grid-cols-2">
              {(["PICKUP", "DELIVERY"] as const).map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-secondary bg-card p-4 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-secondary"
                >
                  <RadioGroupItem value={type} />
                  <span className="font-semibold">{FULFILLMENT_LABEL[type]}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {fulfillmentType === "PICKUP" && (
          <p className="rounded-2xl bg-butter px-4 py-3 text-sm">
            Retire na {STORE.name}: {STORE.address}. {STORE.hours}.
          </p>
        )}
      </fieldset>

      <section aria-labelledby="data-titulo" className="flex flex-col gap-2">
        <h2 id="data-titulo" className="text-lg font-semibold">
          Para qual dia?
        </h2>
        <p className="text-sm text-muted-foreground">De amanhã até 30 dias à frente, exceto domingos.</p>
        <Controller
          control={control}
          name="scheduledDate"
          render={({ field }) => (
            <div className="w-fit max-w-full overflow-x-auto rounded-3xl border border-secondary bg-card shadow-soft">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={field.value ? isoToLocalDate(field.value) : undefined}
                defaultMonth={field.value ? isoToLocalDate(field.value) : isoToLocalDate(available[0])}
                onSelect={(date) => field.onChange(date ? localDateToIso(date) : "")}
                disabled={(date) => !availableSet.has(localDateToIso(date))}
                startMonth={isoToLocalDate(available[0])}
                endMonth={isoToLocalDate(available[available.length - 1])}
                className="bg-card [--cell-size:--spacing(10)]"
              />
            </div>
          )}
        />
        {errors.scheduledDate && (
          <p role="alert" className="text-sm text-destructive">
            {errors.scheduledDate.message}
          </p>
        )}
      </section>

      {fulfillmentType === "DELIVERY" && (
        <section aria-labelledby="endereco-titulo" className="flex flex-col gap-4">
          <h2 id="endereco-titulo" className="text-lg font-semibold">
            Endereço de entrega
          </h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field id="address-street" label="Rua" error={addressErrors?.street?.message}>
              {addressInput("street", { autoComplete: "address-line1" })}
            </Field>
            <Field id="address-number" label="Número" error={addressErrors?.number?.message}>
              {addressInput("number")}
            </Field>
          </div>
          <Field id="address-complement" label="Complemento (opcional)" error={addressErrors?.complement?.message}>
            {addressInput("complement", { autoComplete: "address-line2" })}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="address-district" label="Bairro" error={addressErrors?.district?.message}>
              {addressInput("district")}
            </Field>
            <Field id="address-city" label="Cidade" error={addressErrors?.city?.message}>
              {addressInput("city", { autoComplete: "address-level2" })}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <Field id="address-state" label="UF" error={addressErrors?.state?.message}>
              {addressInput("state", { maxLength: 2, autoComplete: "address-level1", placeholder: "SP" })}
            </Field>
            <Field id="address-zipCode" label="CEP" error={addressErrors?.zipCode?.message}>
              {addressInput("zipCode", { inputMode: "numeric", autoComplete: "postal-code", placeholder: "00000-000" })}
            </Field>
          </div>
        </section>
      )}
    </div>
  )
}
