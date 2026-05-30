import { useState } from "react";
import { Loader2, Rocket, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { openExternalUrl } from "@/shared/lib/openExternal";

const SHIPS_URL = "https://maps.adi.sc/";

export default function Ships3DPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PageMotion className="gap-4 px-4 pt-2">
      <div className="flex shrink-0 items-center justify-between">
        <PageHeader
          icon={<Rocket className="h-6 w-6" />}
          title="Vaisseaux 3D"
          description="Visualiseur 3D interactif des vaisseaux Star Citizen — par ADI"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => openExternalUrl(SHIPS_URL)}
          className="shrink-0"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Ouvrir dans le navigateur
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border/50">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Chargement du visualiseur 3D...
              </span>
            </div>
          </div>
        )}
        <iframe
          src={SHIPS_URL}
          className="h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          title="Vaisseaux 3D - ADI Star Citizen Maps"
        />
      </div>
    </PageMotion>
  );
}
