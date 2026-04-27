import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  STATUS_NECESSIDADE,
  STATUS_OFERTA,
  STATUS_MATCH,
} from "@/lib/enums"

const TONE_CLASSES = {
  primary: "bg-primary/15 text-primary border-primary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  warn: "bg-warn/25 text-warn-foreground border-warn/40",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  special: "bg-special/15 text-special border-special/30",
  muted: "bg-muted text-muted-foreground border-border",
}

const MAPS = {
  necessidade: STATUS_NECESSIDADE,
  oferta: STATUS_OFERTA,
  match: STATUS_MATCH,
}

export function StatusBadge({ tipo, status, className = "" }) {
  const map = MAPS[tipo]
  const info = map?.[status] || { label: status, tone: "muted" }
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[info.tone], "font-medium", className)}
    >
      {info.label}
    </Badge>
  )
}
