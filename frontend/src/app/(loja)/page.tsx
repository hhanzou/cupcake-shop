import { CupcakeIllustration } from "@/components/illustrations/cupcake"

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-4 py-12 text-center">
      <CupcakeIllustration className="size-32" />
      <h1 className="text-4xl font-semibold">Bem-vindo à CupcakeShop</h1>
      <p>Cupcakes fresquinhos, feitos com carinho.</p>
    </section>
  )
}
