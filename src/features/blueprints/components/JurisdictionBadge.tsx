import { Shield } from "lucide-react";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import {
  jurisdictionDisplayKind,
  jurisdictionLabelFr,
} from "@/features/blueprints/blueprints.catalog.lib";
import { cn } from "@/lib/utils";

const SAFE_CLASS = "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
const HOSTILE_CLASS = "border-red-500/35 bg-red-500/10 text-red-300";

export interface JurisdictionBadgeProps {
  name: string;
  className?: string;
}

export function JurisdictionBadge({ name, className }: JurisdictionBadgeProps) {
  const kind = jurisdictionDisplayKind(name);
  const label = jurisdictionLabelFr(name);

  if (kind === "plain") {
    return (
      <BlueprintMetaBadge variant="jurisdiction" className={className}>
        {label}
      </BlueprintMetaBadge>
    );
  }

  const isSafe = kind === "safe";
  return (
    <BlueprintMetaBadge
      variant="jurisdiction"
      icon={Shield}
      className={cn(isSafe ? SAFE_CLASS : HOSTILE_CLASS, className)}
    >
      {isSafe ? "Safe" : "Hostile"} · {label}
    </BlueprintMetaBadge>
  );
}
