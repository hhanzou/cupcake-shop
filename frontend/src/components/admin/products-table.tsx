"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { imageUrl } from "@/lib/image-url"
import { formatPrice } from "@/lib/money"
import { deleteProduct, listProducts } from "@/lib/services/products"
import type { Product } from "@/lib/types"

const LIMIT = 10

export function ProductsTable() {
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(["admin-products", page], () => listProducts({ page, limit: LIMIT }, "no-store"), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteProduct(toDelete.id)
      toast.success(`${toDelete.name} foi excluído`)
      setToDelete(null)
      // Se a página ficou vazia, volta uma.
      if (data && data.data.length === 1 && page > 1) setPage(page - 1)
      else await mutate()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível excluir o cupcake.")
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Cupcakes</h1>
        <Link href="/admin/cupcakes/novo" className={buttonVariants()}>
          <Plus aria-hidden="true" />
          Novo cupcake
        </Link>
      </div>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error instanceof ApiError ? error.message : "Não foi possível carregar os cupcakes."}</span>
          <Button size="sm" variant="secondary" onClick={() => mutate()}>
            Tentar de novo
          </Button>
        </div>
      ) : isLoading || !data ? (
        <Skeleton role="status" aria-label="Carregando cupcakes" className="h-72 rounded-3xl" />
      ) : data.data.length === 0 ? (
        <p className="rounded-3xl border border-secondary bg-card p-8 text-center">Nenhum cupcake cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-secondary bg-card p-3 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Sabor</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative size-14 overflow-hidden rounded-xl">
                      <Image src={imageUrl(product.imageUrl)} alt={`Foto de ${product.name}`} fill unoptimized sizes="56px" className="object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{product.name}</TableCell>
                  <TableCell>{product.flavor}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.categories.map((c) => c.name).join(", ")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/cupcakes/${product.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })} aria-label={`Editar ${product.name}`}>
                        <Pencil aria-hidden="true" />
                        Editar
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => setToDelete(product)} aria-label={`Excluir ${product.name}`}>
                        <Trash2 aria-hidden="true" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </nav>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O cupcake sai da loja e não poderá ser reativado por este painel. Pedidos já feitos continuam intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
