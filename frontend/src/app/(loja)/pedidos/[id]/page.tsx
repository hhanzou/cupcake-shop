import type { Metadata } from "next"
import { Suspense } from "react"
import { OrderDetail } from "@/components/orders/order-detail"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Pedido" }

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<Skeleton className="h-80 rounded-3xl" />}>
      <OrderDetail id={id} />
    </Suspense>
  )
}
