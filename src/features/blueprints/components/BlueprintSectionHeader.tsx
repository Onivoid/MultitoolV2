import type { LucideIcon } from "lucide-react";
import { BP_ICON_BOX, BP_SECTION_HEADER } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

export interface BlueprintSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

export function BlueprintSectionHeader({
  icon: Icon,
  title,
  subtitle,
  className,
}: BlueprintSectionHeaderProps) {
  return (
    <header className={cn(BP_SECTION_HEADER, "shrink-0", className)}>
      <div className={BP_ICON_BOX}>
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold leading-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
