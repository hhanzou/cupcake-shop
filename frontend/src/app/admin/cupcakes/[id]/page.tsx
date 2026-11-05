import type { Metadata } from "next"
import { ProductEditor } from "@/components/admin/product-editor"

export const metadata: Metadata = { title: "Admin | Editar cupcake" }

export default async function EditarCupcakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductEditor id={id} />
}
