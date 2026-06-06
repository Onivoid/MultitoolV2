import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BP_META_BADGE } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

export type BlueprintMetaBadgeVariant =
  | "system"
  | "jurisdiction"
  | "mission"
  | "neutral"
  | "grade"
  | "size"
  | "tier"
  | "category"
  | "class"
  | "manufacturer"
  | "default";

const VARIANT_CLASS: Record<BlueprintMetaBadgeVariant, string> = {
  system: "text-primary",
  jurisdiction: "text-muted-foreground",
  mission: "text-muted-foreground",
  neutral: "text-muted-foreground",
  grade:
    "border-amber-500/35 bg-amber-500/15 font-bold text-amber-200/95 tabular-nums",
  size: "border-primary/30 bg-primary/12 font-semibold text-primary",
  tier: "border-primary/25 bg-primary/8 font-medium text-primary",
  manufacturer: "border-border/50 bg-background/30 text-foreground/90",
  category: "text-foreground",
  class: "text-muted-foreground",
  default: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400/95",
};

export interface BlueprintMetaBadgeProps {
  children: ReactNode;
  variant?: BlueprintMetaBadgeVariant;
  icon?: LucideIcon;
  className?: string;
  /** Style badge filtre cliquable (hover + actif). */
  interactive?: boolean;
  active?: boolean;
}

export function BlueprintMetaBadge({
  children,
  variant = "neutral",
  icon: Icon,
  className,
  interactive = false,
  active = false,
}: BlueprintMetaBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        BP_META_BADGE,
        VARIANT_CLASS[variant],
        interactive &&
          "cursor-pointer transition-colors hover:border-primary/45 hover:bg-primary/18",
        active && "border-primary/50 bg-primary/20 ring-1 ring-primary/30",
        className,
      )}
    >
      {Icon && <Icon className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />}
      {children}
    </Badge>
  );
}
