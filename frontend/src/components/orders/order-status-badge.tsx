import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL } from "@/lib/labels"
import type { OrderStatus } from "@/lib/types"

const COLORS: Record<OrderStatus, string> = {
  CONFIRMED: "bg-lilac",
  PREPARING: "bg-butter",
  READY: "bg-mint",
  COMPLETED: "bg-mint",
  CANCELED: "bg-destructive/15",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={`${COLORS[status]} text-foreground`}>{STATUS_LABEL[status]}</Badge>
}
