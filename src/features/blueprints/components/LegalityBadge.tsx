import { Scale } from "lucide-react";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import {
  legalityBadgeClass,
  legalityLabel,
} from "@/features/blueprints/blueprints.location-colors";
import { cn } from "@/lib/utils";

export interface LegalityBadgeProps {
  lawful?: boolean | null;
  illegal?: boolean | null;
  className?: string;
}

export function LegalityBadge({ lawful, illegal, className }: LegalityBadgeProps) {
  const label = legalityLabel(lawful, illegal);
  if (label === "—") return null;
  return (
    <BlueprintMetaBadge
      variant="jurisdiction"
      icon={Scale}
      className={cn(
        legalityBadgeClass(lawful ?? (illegal != null ? !illegal : null)),
        className,
      )}
    >
      {label}
    </BlueprintMetaBadge>
  );
}
