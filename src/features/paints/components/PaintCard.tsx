import { useState } from "react";
import { motion } from "framer-motion";
import { Expand, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  paintDisplayTitle,
  resolvePaintManufacturer,
} from "@/features/paints/paints.lib";
import type { PaintSummary } from "@/features/paints/paints.types";
import { MediaLightbox } from "@/shared/components/MediaLightbox";

interface PaintCardProps {
  paint: PaintSummary;
  index: number;
}

export function PaintCard({ paint, index }: PaintCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const displayName = paintDisplayTitle(paint);
  const manufacturer = resolvePaintManufacturer(paint);
  const imageSrc = paint.imageUrl ?? paint.thumbnailUrl ?? null;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: (index % 16) * 0.03 }}
        className="settings-section group flex h-[300px] cursor-pointer flex-col overflow-hidden"
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        role="button"
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
          {imageSrc && (
            <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-background/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="h-3.5 w-3.5 text-foreground" />
            </span>
          )}
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

          {manufacturer.name && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {manufacturer.name}
            </p>
          )}

          <div className="mt-auto flex shrink-0 items-center gap-1 pt-2 text-xs font-medium text-primary">
            <Expand className="h-3.5 w-3.5" />
            Agrandir
          </div>
        </div>
      </motion.article>

      <MediaLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        src={imageSrc}
        title={displayName}
        description={
          paint.descriptionEn ??
          (manufacturer.name ? `Marque : ${manufacturer.name}` : undefined)
        }
        alt={displayName}
      />
    </>
  );
}
