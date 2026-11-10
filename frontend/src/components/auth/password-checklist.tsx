import { Check, Circle } from "lucide-react"
import { checkPassword } from "@/lib/password"
import { cn } from "@/lib/utils"

/**
 * Lista de exigências da senha, atualizada a cada tecla. Fica sempre visível no cadastro,
 * para a pessoa saber as regras antes de digitar. Sem aria-live, para o leitor de tela não
 * anunciar a lista inteira a cada caractere; o campo aponta para ela via aria-describedby.
 */
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  const rules = checkPassword(password)
  const done = rules.filter((r) => r.ok).length

  return (
    <div id={id} className="rounded-2xl bg-secondary/40 px-3 py-2.5">
      <p className="mb-1.5 text-xs font-semibold">
        Sua senha precisa ter <span className="font-normal text-muted-foreground">({done} de {rules.length})</span>
      </p>
      <ul className="grid gap-1 text-sm sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              rule.ok ? "text-emerald-700" : "text-muted-foreground",
            )}
          >
            {rule.ok ? (
              <Check key="ok" className="animate-pop size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
            ) : (
              <Circle key="pending" className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{rule.ok ? " (cumprido)" : " (pendente)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
