import Link from "next/link"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { buttonVariants } from "@/components/ui/button"

export default function LojaNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <CupcakeIllustration className="size-28" />
      <h1 className="text-2xl font-semibold">Isso sumiu da vitrine</h1>
      <p className="text-muted-foreground">Não encontramos o que você procurava.</p>
      <Link href="/" className={buttonVariants()}>
        Voltar ao catálogo
      </Link>
    </div>
  )
}
