import type { Metadata } from "next"
import { Fredoka, Nunito } from "next/font/google"
import { ApiSlowNotifier } from "@/components/layout/api-slow-notifier"
import { SessionBootstrap } from "@/components/auth/session-bootstrap"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] })
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "CupcakeShop", template: "%s | CupcakeShop" },
  description: "Cupcakes fresquinhos, feitos com carinho. Escolha, agende e receba.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SessionBootstrap />
        <ApiSlowNotifier />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
