import { motion } from "framer-motion";
import { MapPin, Package } from "lucide-react";
import {
  type BlueprintEntry,
  formatBlueprintDate,
  formatBlueprintOwner,
} from "@/features/blueprints/blueprints.lib";
import { cn } from "@/lib/utils";

export interface BlueprintCardProps {
  blueprint: BlueprintEntry;
  index?: number;
  className?: string;
}

export function getBlueprintKey(blueprint: BlueprintEntry): string {
  return `${blueprint.owner}-${blueprint.productName}-${blueprint.ts}`;
}

export function BlueprintCard({ blueprint, index = 0, className }: BlueprintCardProps) {
  const hasMission =
    Boolean(blueprint.missionDebugName) || Boolean(blueprint.missionTrigger);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 16) * 0.03 }}
      className={cn("settings-section flex flex-col overflow-hidden", className)}
      data-blueprint-key={getBlueprintKey(blueprint)}
      data-no-window-drag
    >
      <header className="settings-section-header flex items-start gap-2 px-3 py-2 pl-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
          <Package className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {blueprint.productName}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatBlueprintOwner(blueprint.owner)}
          </p>
        </div>
      </header>

      {hasMission && (
        <div className="flex items-start gap-1.5 px-3 pb-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
          <p className="line-clamp-2 leading-relaxed">
            {blueprint.missionDebugName}
            {blueprint.missionTrigger && (
              <span className="opacity-75"> ({blueprint.missionTrigger})</span>
            )}
          </p>
        </div>
      )}

      <footer className="settings-section-footer px-3 py-2 text-[11px] text-muted-foreground">
        <time dateTime={new Date(blueprint.ts * 1000).toISOString()}>
          {formatBlueprintDate(blueprint.ts)}
        </time>
      </footer>
    </motion.article>
  );
}
