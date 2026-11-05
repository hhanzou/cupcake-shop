import type { Metadata } from "next"
import { CategoriesManager } from "@/components/admin/categories-manager"

export const metadata: Metadata = { title: "Admin | Categorias" }

export default function AdminCategoriasPage() {
  return <CategoriesManager />
}
