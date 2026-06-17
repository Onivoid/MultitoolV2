import { motion } from "framer-motion";
import { ExternalLink, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PaintSummary } from "@/features/paints/paints.types";
import { openExternalUrl } from "@/shared/lib/openExternal";

interface PaintCardProps {
  paint: PaintSummary;
  index: number;
}

export function PaintCard({ paint, index }: PaintCardProps) {
  const displayName = paint.nameFr?.trim() || paint.name;
  const wikiUrl =
    paint.webUrl?.replace("api.star-citizen.wiki", "star-citizen.wiki") ??
    `https://star-citizen.wiki/items/${paint.uuid}`;

  const openWiki = () => void openExternalUrl(wikiUrl);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 16) * 0.03 }}
      className="settings-section group flex h-[300px] cursor-pointer flex-col overflow-hidden"
      onClick={openWiki}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openWiki();
        }
      }}
      role="link"
      tabIndex={0}
      data-no-window-drag
    >
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-primary/5">
        {paint.thumbnailUrl ? (
          <img
            src={paint.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Palette className="h-10 w-10 opacity-40" />
            {paint.shipName && (
              <span className="text-xs font-medium opacity-70">{paint.shipName}</span>
            )}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-1.5">
          {paint.shipName && (
            <Badge variant="outline" className="text-[10px]">
              {paint.shipName}
            </Badge>
          )}
          {paint.eventSources.slice(0, 2).map((event) => (
            <Badge key={event} variant="secondary" className="text-[10px]">
              {event}
            </Badge>
          ))}
        </div>

        <h3 className="mb-1 line-clamp-2 shrink-0 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {displayName}
        </h3>

        {paint.manufacturerName && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {paint.manufacturerName}
          </p>
        )}

        <div className="mt-auto flex shrink-0 items-center gap-1 pt-2 text-xs font-medium text-primary">
          <ExternalLink className="h-3.5 w-3.5" />
          Voir sur le Wiki
        </div>
      </div>
    </motion.article>
  );
}
