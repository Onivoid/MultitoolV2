import { ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import type {
  ApiCatalogBadge,
  BlueprintCatalogDetail,
  HeroStat,
} from "@/features/blueprints/blueprints.catalog.types";
import { BP_ACTION_BTN, bpDetailBlock } from "@/features/blueprints/blueprints.ui";
import {
  catalogDisplayName,
  formatCraftDuration,
} from "@/features/blueprints/blueprints.catalog.lib";
import {
  FAMILY_LABEL_FR,
  resolveItemFamily,
} from "@/features/blueprints/blueprints.taxonomy";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { cn } from "@/lib/utils";

export interface BlueprintHeroCardProps {
  detail: BlueprintCatalogDetail;
  isOwned: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  unlockDate?: number | null;
}

function formatUnlockDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlueprintHeroCard({
  detail,
  isOwned,
  isWishlisted = false,
  onToggleWishlist,
  unlockDate,
}: BlueprintHeroCardProps) {
  const family = resolveItemFamily(detail);
  const displayName = catalogDisplayName(detail, "fr");
  const nameEn = detail.nameEn?.trim();
  const showEn = nameEn && nameEn !== displayName;
  const badges: ApiCatalogBadge[] = detail.catalogBadges?.length
    ? detail.catalogBadges
    : (detail.summaryBadges ?? []);
  const heroStats: HeroStat[] = detail.heroStats ?? [];

  return (
    <div className={cn(bpDetailBlock(), "space-y-3")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-primary">
            {FAMILY_LABEL_FR[family]}
            {detail.outputTypeLabel ? ` · ${detail.outputTypeLabel}` : ""}
          </p>
          <h2 className="text-base font-semibold leading-tight">{displayName}</h2>
          {showEn && <p className="text-xs text-muted-foreground">{nameEn}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleWishlist && (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label={
                isWishlisted ? "Retirer de la wishlist" : "Ajouter à la wishlist"
              }
              aria-pressed={isWishlisted}
              onClick={() => onToggleWishlist()}
              data-no-window-drag
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isWishlisted && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
          )}
          {detail.itemProfile?.imageUrl && (
            <img
              src={detail.itemProfile.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md border border-border/40 bg-background/30 object-contain"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {isOwned && (
          <BlueprintMetaBadge
            variant="system"
            className="border-primary/35 bg-primary/10 text-primary"
          >
            Possédé
            {unlockDate != null && ` · ${formatUnlockDate(unlockDate)}`}
          </BlueprintMetaBadge>
        )}
        {badges.map((b) => (
          <BlueprintMetaBadge key={b.key} variant="neutral">
            {b.label}
          </BlueprintMetaBadge>
        ))}
      </div>

      {heroStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {heroStats.map((s) => (
            <div
              key={s.label}
              className="rounded-md border border-border/35 bg-background/20 px-2 py-1.5"
            >
              <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
              <p className="text-xs font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Craft {formatCraftDuration(detail.craftTimeSeconds)}</span>
        {detail.itemProfile?.manufacturerName && (
          <span>· {detail.itemProfile.manufacturerName}</span>
        )}
        {detail.webUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(BP_ACTION_BTN, "ml-auto h-8")}
            onClick={() =>
              void invokeCommand(TAURI_COMMANDS.openExternal, { url: detail.webUrl })
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Wiki
          </Button>
        )}
      </div>
    </div>
  );
}
