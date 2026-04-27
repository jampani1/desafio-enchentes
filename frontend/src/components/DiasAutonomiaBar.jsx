import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function DiasAutonomiaBar({ dias, dias_alvo = 7, className = "" }) {
  if (dias == null || Number.isNaN(dias)) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>—</div>
    )
  }

  const pct = Math.max(0, Math.min(100, (dias / dias_alvo) * 100))

  let cor = "bg-accent"
  let texto = "text-accent"
  if (dias < 3) {
    cor = "bg-destructive"
    texto = "text-destructive"
  } else if (dias < 5) {
    cor = "bg-warn"
    texto = "text-warn-foreground"
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-sm font-semibold", texto)}>
          {dias.toFixed(1)} dias
        </span>
        <span className="text-xs text-muted-foreground">
          alvo {dias_alvo}d
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all", cor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
