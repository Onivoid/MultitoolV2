import { useState } from "react";
import orbituaryImg from "@/assets/jpg/orbituary.jpg";
import ruinstationImg from "@/assets/jpg/ruinstation.jpg";
import checkmateImg from "@/assets/jpg/checkmate.jpg";
import { MediaLightbox } from "@/shared/components/MediaLightbox";
import { cn } from "@/lib/utils";

interface HelpCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

const HELP_CARDS: HelpCard[] = [
  {
    id: "orbituary",
    title: "Orbituary",
    subtitle: "Tablette 4",
    description:
      "Carte d'accès du terminal Orbituary — lancez le minuteur 30 min avant d'entrer.",
    imageUrl: orbituaryImg,
  },
  {
    id: "ruin-station",
    title: "Ruin Station",
    subtitle: "Tablettes 5 & 6",
    description: "Deux terminaux Ruin Station pour les accès hangar Pyro.",
    imageUrl: ruinstationImg,
  },
  {
    id: "checkmate",
    title: "Checkmate",
    subtitle: "Tablettes 1–3",
    description: "Terminaux Checkmate — synchronisez avec le cycle PYAM.",
    imageUrl: checkmateImg,
  },
];

export function HangarHelpCards() {
  const [lightbox, setLightbox] = useState<HelpCard | null>(null);

  return (
    <>
      <section className="space-y-3" data-no-window-drag>
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cartes d&apos;aide
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {HELP_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={cn(
                "settings-section group flex flex-col overflow-hidden text-left transition-all",
                "hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]",
              )}
              onClick={() => setLightbox(card)}
            >
              <div className="relative h-28 overflow-hidden bg-primary/5">
                <img
                  src={card.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="text-sm font-semibold leading-snug">{card.title}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary/80">
                  {card.subtitle}
                </p>
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <MediaLightbox
        open={lightbox != null}
        onOpenChange={(open) => !open && setLightbox(null)}
        src={lightbox?.imageUrl ?? null}
        title={lightbox?.title}
        description={
          lightbox
            ? `${lightbox.subtitle} — ${lightbox.description}`
            : undefined
        }
        alt={lightbox?.title ?? "Carte d'aide"}
      />
    </>
  );
}
