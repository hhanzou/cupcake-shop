"use client"

import { useState } from "react"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { Textarea } from "@/components/ui/textarea"
import { MAX_NOTES_LENGTH } from "@/stores/cart"
import type { Product } from "@/lib/types"

/** Observação opcional + botão de adicionar, na página do cupcake. */
export function ProductPurchase({ product }: { product: Product }) {
  const [notes, setNotes] = useState("")

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="product-notes" className="text-sm font-semibold">
          Observações <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <Textarea
          id="product-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={MAX_NOTES_LENGTH}
          rows={2}
          placeholder="Ex.: sem amendoim, morango extra"
          aria-describedby="product-notes-count"
        />
        <span id="product-notes-count" className="self-end text-xs text-muted-foreground">
          {notes.length}/{MAX_NOTES_LENGTH}
        </span>
      </div>
      <AddToCartButton
        product={product}
        notes={notes}
        onAdded={() => setNotes("")}
        className="w-full sm:w-fit"
      />
    </div>
  )
}
