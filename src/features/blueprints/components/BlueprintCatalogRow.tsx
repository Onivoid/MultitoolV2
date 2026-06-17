import { Check, Star } from "lucide-react";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import { JurisdictionBadge } from "@/features/blueprints/components/JurisdictionBadge";
import { SystemBadge } from "@/features/blueprints/components/SystemBadge";
import type { BlueprintMetaBadgeVariant } from "@/features/blueprints/components/BlueprintMetaBadge";
import {
  catalogDisplayName,
  catalogRowBadges,
  CLASS_LABEL_FR,
  resolveBlueprintClass,
  type CatalogBadgeFilter,
} from "@/features/blueprints/blueprints.catalog.lib";
import { classBadgeClass } from "@/features/blueprints/blueprints.location-colors";
import { isCatalogBadgeFilterActive } from "@/features/blueprints/blueprints.catalog.filters";
import type { BlueprintCatalogFilterState } from "@/features/blueprints/blueprints.catalog.filters";
import { bpCatalogRow } from "@/features/blueprints/blueprints.ui";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";
import type { CatalogRowBadgeKind } from "@/features/blueprints/blueprints.catalog.lib";
import { formatBlueprintDate } from "@/features/blueprints/blueprints.lib";
import { cn } from "@/lib/utils";

export interface BlueprintCatalogRowProps {
  item: BlueprintCatalogSummary;
  selected: boolean;
  isOwned: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  unlockedAt?: number;
  filterState?: BlueprintCatalogFilterState;
  onSelect: () => void;
  onBadgeFilter?: (filter: CatalogBadgeFilter) => void;
}

const BADGE_VARIANT: Record<CatalogRowBadgeKind, BlueprintMetaBadgeVariant> = {
  grade: "grade",
  size: "size",
  tier: "tier",
  category: "category",
  class: "class",
  manufacturer: "manufacturer",
  default: "default",
};

export function BlueprintCatalogRow({
  item,
  selected,
  isOwned,
  isWishlisted = false,
  onToggleWishlist,
  unlockedAt,
  filterState,
  onSelect,
  onBadgeFilter,
}: BlueprintCatalogRowProps) {
  const nameFr = catalogDisplayName(item, "fr");
  const nameEn = item.nameEn?.trim();
  const showEn = nameEn && nameEn !== nameFr;
  const systems = (item.unlockSystems ?? []).slice(0, 2);
  const metaBadges = catalogRowBadges(item);
  const classCode = resolveBlueprintClass(item);
  const classStyle = classBadgeClass(classCode);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(bpCatalogRow(selected), "cursor-pointer")}
      data-no-window-drag
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 h-8 w-1 shrink-0 rounded-full",
            isOwned ? "bg-primary" : "bg-border/40",
          )}
          aria-hidden
        />
        {isOwned && (
          <Check
            className="mt-1 h-3.5 w-3.5 shrink-0 text-primary -ml-1"
            aria-label="Débloqué"
          />
        )}
        {onToggleWishlist && (
          <button
            type="button"
            className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={
              isWishlisted ? "Retirer de la wishlist" : "Ajouter à la wishlist"
            }
            aria-pressed={isWishlisted}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            data-no-window-drag
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                isWishlisted && "fill-amber-400 text-amber-400",
              )}
            />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{nameFr}</p>
          {showEn && (
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{nameEn}</p>
          )}
          {metaBadges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {metaBadges.map((b) => {
                const clickable = b.filter != null && onBadgeFilter != null;
                const active =
                  clickable &&
                  filterState != null &&
                  b.filter != null &&
                  isCatalogBadgeFilterActive(filterState, b.filter);

                const badge = (
                  <BlueprintMetaBadge
                    variant={BADGE_VARIANT[b.kind]}
                    interactive={clickable}
                    active={active}
                  >
                    {b.label}
                  </BlueprintMetaBadge>
                );

                if (!clickable) {
                  return <span key={b.key}>{badge}</span>;
                }

                return (
                  <button
                    key={b.key}
                    type="button"
                    className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    title={`Filtrer : ${b.label}`}
                    aria-pressed={active}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBadgeFilter(b.filter!);
                    }}
                    data-no-window-drag
                  >
                    {badge}
                  </button>
                );
              })}
            </div>
          )}
          {(systems.length > 0 ||
            (item.unlockJurisdictions?.length ?? 0) > 0 ||
            classCode) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {systems.map((s) => (
                <SystemBadge key={s} name={s} />
              ))}
              {(item.unlockJurisdictions ?? []).slice(0, 1).map((j) => (
                <JurisdictionBadge key={j} name={j} />
              ))}
              {classCode && classStyle && (
                <BlueprintMetaBadge variant="class" className={classStyle}>
                  {CLASS_LABEL_FR[classCode]}
                </BlueprintMetaBadge>
              )}
            </div>
          )}
          {unlockedAt != null && (
            <p className="mt-0.5 text-[10px] text-muted-foreground/80">
              {formatBlueprintDate(unlockedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
