import { Check, ChefHat, ClipboardCheck, House, PackageCheck, Store, XCircle } from "lucide-react"
import { formatDate } from "@/lib/schedule"
import { cn } from "@/lib/utils"
import type { FulfillmentType, OrderStatus } from "@/lib/types"

type Step = { status: OrderStatus; title: string; text: string; icon: React.ComponentType<{ className?: string }> }

function stepsFor(type: FulfillmentType, date: string): Step[] {
  const delivery = type === "DELIVERY"
  return [
    { status: "CONFIRMED", title: "Pedido confirmado", text: "Recebemos o seu pedido com carinho.", icon: ClipboardCheck },
    { status: "PREPARING", title: "Em preparo", text: "Os cupcakes estão saindo do forno.", icon: ChefHat },
    {
      status: "READY",
      title: delivery ? "Pronto para sair" : "Pronto para retirada",
      text: delivery ? `Embalado e separado para a entrega de ${formatDate(date)}.` : `Esperando por você na loja em ${formatDate(date)}.`,
      icon: PackageCheck,
    },
    {
      status: "COMPLETED",
      title: delivery ? "Entregue" : "Retirado",
      text: delivery ? "Pedido entregue. Bom apetite!" : "Pedido retirado. Bom apetite!",
      icon: delivery ? House : Store,
    },
  ]
}

const ORDER: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY", "COMPLETED"]

export function OrderTimeline({
  status,
  fulfillmentType,
  scheduledDate,
}: {
  status: OrderStatus
  fulfillmentType: FulfillmentType
  scheduledDate: string
}) {
  if (status === "CANCELED") {
    return (
      <div role="status" className="flex items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/10 p-5">
        <XCircle className="size-8 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-semibold">Pedido cancelado</p>
          <p className="text-sm text-muted-foreground">Se tiver dúvidas, fale com a loja.</p>
        </div>
      </div>
    )
  }

  const current = ORDER.indexOf(status)
  const steps = stepsFor(fulfillmentType, scheduledDate)

  return (
    <section aria-labelledby="acompanhe" className="rounded-3xl border border-secondary bg-card p-5 shadow-soft">
      <h2 id="acompanhe" className="mb-4 text-xl font-semibold">
        {fulfillmentType === "DELIVERY" ? "Acompanhe sua entrega" : "Acompanhe seu pedido"}
      </h2>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const done = i < current || status === "COMPLETED"
          const active = i === current && status !== "COMPLETED"
          const Icon = step.icon
          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={active ? "step" : undefined}>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("absolute top-10 left-5 -ml-px h-[calc(100%-2.5rem)] w-0.5", i < current ? "bg-primary" : "bg-secondary")}
                />
              )}
              <span
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-full border-2",
                  done && "border-primary bg-primary",
                  active && "animate-pulse-ring border-primary bg-card",
                  !done && !active && "border-secondary bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
              </span>
              <div className={cn("pt-1.5", !done && !active && "opacity-60")}>
                <p className="font-semibold">
                  {step.title}
                  <span className="sr-only">{done ? " (concluído)" : active ? " (etapa atual)" : " (pendente)"}</span>
                </p>
                {(active || (status === "COMPLETED" && i === 3)) && <p className="text-sm text-muted-foreground">{step.text}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
