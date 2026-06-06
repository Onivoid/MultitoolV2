import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { IngredientInspectorBody } from "@/features/blueprints/components/IngredientInspector";
import type {
  IngredientGroup,
  IngredientOption,
} from "@/features/blueprints/blueprints.catalog.types";
import { bpDetailBlock } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

export interface BlueprintIngredientExpandProps {
  option: IngredientOption;
  group: IngredientGroup;
  onFilterByResource?: (ids: string[], label: string) => void;
}

export function BlueprintIngredientExpand({
  option,
  group,
  onFilterByResource,
}: BlueprintIngredientExpandProps) {
  const [open, setOpen] = useState(false);
  const label = option.nameFr || option.name;

  return (
    <div className={cn(bpDetailBlock(), "overflow-hidden p-0")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs hover:bg-primary/5"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/30 px-2 py-2">
          <IngredientInspectorBody
            active
            option={option}
            group={group}
            onFilterByResource={onFilterByResource}
          />
        </div>
      )}
    </div>
  );
}
