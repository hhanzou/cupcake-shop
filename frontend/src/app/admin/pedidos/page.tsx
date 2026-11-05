import type { Metadata } from "next"
import { OrdersManager } from "@/components/admin/orders-manager"

export const metadata: Metadata = { title: "Admin | Pedidos" }

export default function AdminPedidosPage() {
  return <OrdersManager />
}
