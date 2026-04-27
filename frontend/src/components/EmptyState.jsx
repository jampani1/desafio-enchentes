import { cn } from "@/lib/utils"

export function EmptyState({ titulo, descricao, acao, icone, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-4 gap-3",
        className
      )}
    >
      {icone && (
        <div className="text-muted-foreground/60" aria-hidden>
          {icone}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-medium">{titulo}</h3>
        {descricao && (
          <p className="text-sm text-muted-foreground max-w-sm">{descricao}</p>
        )}
      </div>
      {acao}
    </div>
  )
}
