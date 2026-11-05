"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Field } from "@/components/auth/field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { applyFieldErrors } from "@/lib/form-errors"
import { imageUrl } from "@/lib/image-url"
import { toApiPrice } from "@/lib/money"
import { listCategories } from "@/lib/services/categories"
import { createProduct, listProducts, updateProduct, uploadProductImage } from "@/lib/services/products"
import type { Product } from "@/lib/types"

const MAX_IMAGE_BYTES = 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Nome muito longo"),
  description: z.string().trim().max(1000, "Descrição muito longa"),
  flavor: z.string().trim().min(1, "Informe o sabor").max(60, "Sabor muito longo"),
  price: z
    .string()
    .refine((v) => toApiPrice(v) !== null, "Use um valor como 12,50 (até 2 casas decimais)")
    .refine((v) => Number(toApiPrice(v) ?? 0) > 0, "O preço deve ser maior que zero"),
  categoryIds: z.array(z.string()).min(1, "Escolha ao menos uma categoria"),
})
type Values = z.infer<typeof schema>

function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use uma imagem JPEG, PNG ou WebP"
  if (file.size > MAX_IMAGE_BYTES) return "A imagem pode ter no máximo 1 MB"
  return null
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const editing = !!product

  const { data: categories, error: categoriesError } = useSWR("admin-form-categories", () => listCategories("no-store"), {
    revalidateOnFocus: false,
  })
  const { data: all } = useSWR("admin-form-flavors", () => listProducts({ limit: 50 }, "no-store"), {
    revalidateOnFocus: false,
  })
  const flavors = [...new Set(all?.data.map((p) => p.flavor) ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR"))

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      flavor: product?.flavor ?? "",
      price: product ? product.price.replace(".", ",") : "",
      categoryIds: product?.categories.map((c) => c.id) ?? [],
    },
  })

  // Libera a URL temporária quando a pré-visualização muda ou a tela fecha.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (!selected) {
      setFile(null)
      setPreview(null)
      setImageError(null)
      return
    }
    const problem = validateImage(selected)
    setImageError(problem)
    if (problem) {
      e.target.value = ""
      setFile(null)
      setPreview(null)
    } else {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  async function onSubmit(values: Values) {
    setFormError(null)
    const body = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      flavor: values.flavor.trim(),
      price: toApiPrice(values.price) as string,
      categoryIds: values.categoryIds,
    }

    let saved: Product
    try {
      saved = editing ? await updateProduct(product.id, body) : await createProduct(body)
    } catch (error) {
      if (!applyFieldErrors(error, setError, ["name", "description", "flavor", "price", "categoryIds"])) {
        setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar o cupcake.")
      }
      return
    }

    if (file) {
      try {
        await uploadProductImage(saved.id, file)
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Não foi possível enviar a imagem."
        toast.error(`O cupcake foi salvo, mas a imagem falhou: ${message}`)
        // O cupcake já existe: abre a edição para tentar o envio de novo.
        if (!editing) router.replace(`/admin/cupcakes/${saved.id}`)
        else setImageError(message)
        return
      }
    }

    toast.success(editing ? "Cupcake atualizado" : "Cupcake criado")
    router.push("/admin/cupcakes")
  }

  const currentImage = preview ?? (product?.imageUrl ? imageUrl(product.imageUrl) : null)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-semibold">{editing ? `Editar ${product.name}` : "Novo cupcake"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 rounded-3xl border border-secondary bg-card p-6 shadow-soft">
        <Field id="product-name" label="Nome" error={errors.name?.message}>
          <Input id="product-name" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "product-name-error" : undefined} {...register("name")} />
        </Field>

        <Field id="product-description" label="Descrição (opcional)" error={errors.description?.message}>
          <Textarea id="product-description" rows={3} aria-invalid={errors.description ? true : undefined} {...register("description")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="product-flavor" label="Sabor" error={errors.flavor?.message}>
            <Input id="product-flavor" list="flavor-options" aria-invalid={errors.flavor ? true : undefined} aria-describedby={errors.flavor ? "product-flavor-error" : undefined} {...register("flavor")} />
            <datalist id="flavor-options">
              {flavors.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Field>
          <Field id="product-price" label="Preço (R$)" error={errors.price?.message}>
            <Input id="product-price" inputMode="decimal" placeholder="12,50" aria-invalid={errors.price ? true : undefined} aria-describedby={errors.price ? "product-price-error" : undefined} {...register("price")} />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm leading-none font-medium">Categorias</legend>
          {categoriesError ? (
            <p role="alert" className="text-sm text-destructive">
              Não foi possível carregar as categorias.
            </p>
          ) : !categories ? (
            <Skeleton className="h-10 rounded-full" />
          ) : (
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {categories.data.map((category) => {
                    const checked = field.value.includes(category.id)
                    return (
                      <Label key={category.id} className="cursor-pointer rounded-full border border-secondary bg-card px-4 py-2 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-secondary">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            field.onChange(next ? [...field.value, category.id] : field.value.filter((id) => id !== category.id))
                          }
                        />
                        {category.name}
                      </Label>
                    )
                  })}
                </div>
              )}
            />
          )}
          {errors.categoryIds && (
            <p role="alert" className="text-sm text-destructive">
              {errors.categoryIds.message}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-image">Imagem {editing ? "(deixe em branco para manter a atual)" : "(opcional)"}</Label>
          {currentImage && (
            <div className="relative aspect-[9/10] w-full max-w-xs overflow-hidden rounded-2xl border border-secondary">
              <Image src={currentImage} alt={preview ? "Pré-visualização da nova imagem" : `Imagem atual de ${product?.name}`} fill unoptimized sizes="320px" className="object-cover" />
            </div>
          )}
          <input
            id="product-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            aria-invalid={imageError ? true : undefined}
            aria-describedby="product-image-hint"
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold"
          />
          <p id="product-image-hint" className="text-xs text-muted-foreground">
            JPEG, PNG ou WebP, até 1 MB.
          </p>
          {imageError && (
            <p role="alert" className="text-sm text-destructive">
              {imageError}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : editing ? "Salvar alterações" : "Criar cupcake"}
          </Button>
          <Link href="/admin/cupcakes" className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium hover:bg-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
