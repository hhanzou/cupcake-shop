"use client"

import { useState } from "react"
import useSWR from "swr"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Field } from "@/components/auth/field"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/services/categories"
import type { Category } from "@/lib/types"

// `null` = diálogo fechado, "new" = criando, Category = editando
type Editing = null | "new" | Category

export function CategoriesManager() {
  const { data, error, isLoading, mutate } = useSWR("admin-categories", () => listCategories("no-store"), {
    revalidateOnFocus: false,
  })

  const [editing, setEditing] = useState<Editing>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openEditor(target: Editing) {
    setEditing(target)
    setName(target && target !== "new" ? target.name : "")
    setNameError(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError("Informe o nome da categoria")
      return
    }
    setSaving(true)
    setNameError(null)
    try {
      if (editing === "new") await createCategory({ name: trimmed })
      else if (editing) await updateCategory(editing.id, { name: trimmed })
      toast.success(editing === "new" ? "Categoria criada" : "Categoria atualizada")
      setEditing(null)
      await mutate()
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : "Não foi possível salvar a categoria.")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCategory(toDelete.id)
      toast.success(`${toDelete.name} foi excluída`)
      setToDelete(null)
      await mutate()
    } catch (err) {
      // Ex.: 409 quando ainda há cupcake ativo na categoria.
      setDeleteError(err instanceof ApiError ? err.message : "Não foi possível excluir a categoria.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Categorias</h1>
        <Button onClick={() => openEditor("new")}>
          <Plus aria-hidden="true" />
          Nova categoria
        </Button>
      </div>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error instanceof ApiError ? error.message : "Não foi possível carregar as categorias."}</span>
          <Button size="sm" variant="secondary" onClick={() => mutate()}>
            Tentar de novo
          </Button>
        </div>
      ) : isLoading || !data ? (
        <Skeleton role="status" aria-label="Carregando categorias" className="h-48 rounded-3xl" />
      ) : data.data.length === 0 ? (
        <p className="rounded-3xl border border-secondary bg-card p-8 text-center">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-secondary bg-card p-3 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-semibold">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="secondary" size="sm" onClick={() => openEditor(category)} aria-label={`Editar ${category.name}`}>
                        <Pencil aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null)
                          setToDelete(category)
                        }}
                        aria-label={`Excluir ${category.name}`}
                      >
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

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !saving && setEditing(null)}>
        <DialogContent>
          <form onSubmit={save} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? "Nova categoria" : "Editar categoria"}</DialogTitle>
              <DialogDescription>O nome aparece nos filtros e nos selos dos cupcakes.</DialogDescription>
            </DialogHeader>
            <Field id="category-name" label="Nome" error={nameError ?? undefined}>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "category-name-error" : undefined}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Categorias com cupcakes ativos não podem ser excluídas. Mova ou exclua esses cupcakes primeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
