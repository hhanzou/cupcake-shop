import type { Metadata } from "next"
import { ProductsTable } from "@/components/admin/products-table"

export const metadata: Metadata = { title: "Admin | Cupcakes" }

export default function AdminCupcakesPage() {
  return <ProductsTable />
}
