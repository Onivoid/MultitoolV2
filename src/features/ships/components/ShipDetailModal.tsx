import { ExternalLink, GitCompare, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShipLoadoutPanel } from "@/features/ships/components/ShipLoadoutPanel";
import {
  formatProductionStatusLabel,
  isWikiPlaceholder,
  shipDisplayName,
} from "@/features/ships/ships.catalog.lib";
import { formatStat } from "@/features/ships/ships.lib";
import {
  SHIP_MODAL_CONTENT,
  SHIP_MODAL_DIVIDER,
  SHIP_MODAL_INNER,
  SHIP_MODAL_OVERLAY,
  SHIP_MODAL_SECTION_TITLE,
} from "@/features/ships/ships.modal.lib";
import type { VehicleDetail } from "@/features/ships/ships.types";
import { formatAuec } from "@/features/game-stats/gameStats.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { cn } from "@/lib/utils";

interface ShipDetailModalProps {
  open: boolean;
  loading: boolean;
  detail: VehicleDetail | null;
  onClose: () => void;
  onAddCompare?: () => void;
}

function PriceList({
  title,
  rows,
  field,
}: {
  title: string;
  rows: VehicleDetail["uexPrices"]["purchase"];
  field: "priceBuy" | "priceRent";
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className={cn("mb-1", SHIP_MODAL_SECTION_TITLE)}>{title}</h3>
        <p className="text-xs text-muted-foreground">Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className={cn("mb-2", SHIP_MODAL_SECTION_TITLE)}>{title}</h3>
      <ul className="space-y-2">
        {rows.slice(0, 6).map((row, index) => {
          const price = row[field];
          if (price == null) return null;
          const location = row.location?.name ?? row.terminalName ?? "Terminal inconnu";
          const system = row.location?.systemName;
          return (
            <li
              key={`${row.terminalCode ?? index}-${price}`}
              className={cn(SHIP_MODAL_INNER, "px-3 py-2 text-xs")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{location}</p>
                  {system && (
                    <p className="text-[11px] text-muted-foreground">{system}</p>
                  )}
                  {row.terminalName && row.terminalName !== location && (
                    <p className="text-[11px] text-muted-foreground">
                      {row.terminalName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatAuec(price)}
                </span>
              </div>
              {row.uexLink && (
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  onClick={() => void openExternalUrl(row.uexLink!)}
                >
                  <ExternalLink className="h-3 w-3" />
                  UEX
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length > 6 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          + {rows.length - 6} autre{rows.length - 6 > 1 ? "s" : ""} lieu
          {rows.length - 6 > 1 ? "x" : ""}
        </p>
      )}
    </div>
  );
}

export function ShipDetailModal({
  open,
  loading,
  detail,
  onClose,
  onAddCompare,
}: ShipDetailModalProps) {
  const heroImage =
    detail?.images.find((img) => img.originalUrl)?.originalUrl ??
    detail?.thumbnailUrl ??
    null;

  const wikiUrl =
    detail?.webUrl?.replace("api.star-citizen.wiki", "star-citizen.wiki") ?? null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        overlayClassName={SHIP_MODAL_OVERLAY}
        className={cn(
          SHIP_MODAL_CONTENT,
          "flex max-h-[92vh] max-w-[min(96vw,1180px)] flex-col",
        )}
        data-no-window-drag
      >
        <DialogHeader
          className={cn(
            "shrink-0 border-b px-6 py-4 text-left",
            SHIP_MODAL_DIVIDER,
            "bg-foreground/[0.02]",
          )}
        >
          <DialogTitle className="pr-8 text-lg leading-tight">
            {detail ? shipDisplayName(detail) : "Détails du vaisseau"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fiche détaillée du vaisseau avec statistiques, prix et équipement
            d&apos;usine.
          </DialogDescription>
          {detail?.gameName && detail.gameName !== detail.name && (
            <p className="text-xs text-muted-foreground">{detail.gameName}</p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des détails…
          </div>
        ) : !detail ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            Aucun détail disponible.
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
              <div className="space-y-4">
                {heroImage && (
                  <div className={cn("overflow-hidden rounded-lg", SHIP_MODAL_INNER)}>
                    <img
                      src={heroImage}
                      alt=""
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                )}

                {detail.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {detail.images.slice(0, 6).map((img, index) => (
                      <img
                        key={img.originalUrl ?? index}
                        src={img.thumbnailUrl ?? img.originalUrl ?? ""}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded object-cover ring-1 ring-border/30"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {detail.manufacturerName && (
                    <Badge variant="outline">{detail.manufacturerName}</Badge>
                  )}
                  {detail.sizeClass != null && (
                    <Badge variant="outline">T{detail.sizeClass}</Badge>
                  )}
                  {detail.career && !isWikiPlaceholder(detail.career) && (
                    <Badge variant="secondary">{detail.career}</Badge>
                  )}
                  {detail.role && !isWikiPlaceholder(detail.role) && (
                    <Badge variant="secondary">{detail.role}</Badge>
                  )}
                  {formatProductionStatusLabel(detail.productionStatus) && (
                    <Badge variant="secondary" className="capitalize">
                      {formatProductionStatusLabel(detail.productionStatus)}
                    </Badge>
                  )}
                </div>

                {(detail.descriptionFr || detail.descriptionEn) && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {detail.descriptionFr ?? detail.descriptionEn}
                  </p>
                )}

                <section>
                  <h3 className={cn("mb-2", SHIP_MODAL_SECTION_TITLE)}>
                    Statistiques principales
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Cargo", formatStat(detail.cargoCapacity, " SCU")],
                      ["SCM", formatStat(detail.speedScm, " m/s")],
                      ["Boost", formatStat(detail.speedMax, " m/s")],
                      ["Équipage", formatStat(detail.crewMax)],
                      ["PV", formatStat(detail.health)],
                      ["Bouclier", formatStat(detail.shieldHp)],
                      ["DPS pilote", formatStat(detail.pilotDps)],
                      ["Longueur", formatStat(detail.dimensions.length, " m")],
                      ["Largeur", formatStat(detail.dimensions.width, " m")],
                      ["Hauteur", formatStat(detail.dimensions.height, " m")],
                    ].map(([label, value]) => (
                      <div key={label} className={cn(SHIP_MODAL_INNER, "px-2 py-1.5")}>
                        <dt className="text-[10px] text-muted-foreground">{label}</dt>
                        <dd className="font-semibold tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {(detail.msrp != null || detail.pledgeUrl) && (
                  <section className={cn(SHIP_MODAL_INNER, "px-3 py-2 text-xs")}>
                    <p className="font-medium">Pledge store</p>
                    {detail.msrp != null && (
                      <p className="text-muted-foreground">{detail.msrp} USD</p>
                    )}
                    {detail.pledgeUrl && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-xs"
                        onClick={() => void openExternalUrl(detail.pledgeUrl!)}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Voir sur RSI
                      </Button>
                    )}
                  </section>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <PriceList
                    title="Achats en jeu"
                    rows={detail.uexPrices.purchase}
                    field="priceBuy"
                  />
                  <PriceList
                    title="Locations"
                    rows={detail.uexPrices.rental}
                    field="priceRent"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <ShipLoadoutPanel ports={detail.ports} columns={2} />
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col gap-2 border-t px-6 py-4 sm:flex-row",
                SHIP_MODAL_DIVIDER,
                "bg-foreground/[0.015]",
              )}
            >
              {onAddCompare && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="sm:flex-1"
                  onClick={onAddCompare}
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Ajouter au comparateur VS
                </Button>
              )}

              {wikiUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="sm:flex-1"
                  onClick={() => void openExternalUrl(wikiUrl)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir sur Star Citizen Wiki
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
