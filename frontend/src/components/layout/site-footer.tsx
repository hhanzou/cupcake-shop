import { STORE } from "@/lib/store"

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="wavy-divider" aria-hidden="true" />
      <div className="bg-secondary px-4 py-8 text-center text-sm">
        <p className="font-heading text-lg">{STORE.name}</p>
        <p>{STORE.address}</p>
        <p>{STORE.hours}</p>
      </div>
    </footer>
  )
}
