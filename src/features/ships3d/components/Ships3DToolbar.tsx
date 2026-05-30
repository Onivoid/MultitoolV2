import { ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openExternalUrl } from "@/shared/lib/openExternal";

const SHIPS_URL = "https://maps.adi.sc/";

export function Ships3DToolbar() {
  return (
    <section
      className="settings-section mb-2 flex shrink-0 flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:justify-between"
      data-no-window-drag
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
          <Rocket className="h-3.5 w-3.5 text-primary" />
          maps.adi.sc
        </Badge>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Visualiseur 3D interactif · par ADI
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 shrink-0 gap-1.5 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm"
        onClick={() => openExternalUrl(SHIPS_URL)}
        data-no-window-drag
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        Ouvrir dans le navigateur
      </Button>
    </section>
  );
}

export { SHIPS_URL };
