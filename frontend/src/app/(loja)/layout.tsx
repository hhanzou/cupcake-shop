import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="animate-fade-up mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </>
  )
}
