import { z } from "zod"
import { getAvailableDates } from "@/lib/schedule"

export const ADDRESS_FIELDS = ["street", "number", "complement", "district", "city", "state", "zipCode"] as const

export const checkoutSchema = z
  .object({
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    scheduledDate: z.string().min(1, "Escolha uma data"),
    address: z.object({
      street: z.string(),
      number: z.string(),
      complement: z.string(),
      district: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.scheduledDate && !getAvailableDates().includes(value.scheduledDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledDate"],
        message: "Escolha uma data de amanhã até 30 dias à frente, exceto domingos",
      })
    }
    if (value.fulfillmentType !== "DELIVERY") return

    const a = value.address
    const required: [keyof typeof a, string][] = [
      ["street", "Informe a rua"],
      ["number", "Informe o número"],
      ["district", "Informe o bairro"],
      ["city", "Informe a cidade"],
    ]
    for (const [field, message] of required) {
      if (!a[field].trim()) ctx.addIssue({ code: "custom", path: ["address", field], message })
    }
    if (!/^[A-Za-z]{2}$/.test(a.state.trim())) {
      ctx.addIssue({ code: "custom", path: ["address", "state"], message: "Use a sigla com 2 letras (ex.: SP)" })
    }
    if (a.zipCode.replace(/\D/g, "").length !== 8) {
      ctx.addIssue({ code: "custom", path: ["address", "zipCode"], message: "O CEP precisa ter 8 dígitos" })
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const DEFAULT_VALUES: CheckoutValues = {
  fulfillmentType: "PICKUP",
  scheduledDate: "",
  address: { street: "", number: "", complement: "", district: "", city: "", state: "", zipCode: "" },
}
