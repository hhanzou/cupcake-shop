import type { Metadata } from "next"
import { ProductForm } from "@/components/admin/product-form"

export const metadata: Metadata = { title: "Admin | Novo cupcake" }

export default function NovoCupcakePage() {
  return <ProductForm />
}
