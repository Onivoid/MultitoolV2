import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdate } from "@/features/update/useUpdate";
import { formatVersion } from "@/utils/version";
import { cn } from "@/lib/utils";

/**
 * Popup persistante au lancement : reste visible en bas à droite tant que
 * l'utilisateur ne la ferme pas explicitement (réaffichée au prochain démarrage).
 */
export function Updater() {
  const {
    status,
    update,
    downloading,
    downloadProgress,
    canUseUpdater,
    downloadAndInstall,
  } = useUpdate();
  const [dismissed, setDismissed] = useState(false);

  const show =
    canUseUpdater && status === "available" && update?.available && !dismissed;

  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[100] w-full max-w-sm rounded-lg border border-primary/30",
        "bg-background/95 p-4 shadow-lg backdrop-blur-sm",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
      role="dialog"
      aria-labelledby="updater-title"
      data-no-window-drag
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 id="updater-title" className="text-sm font-semibold">
              Mise à jour disponible
            </h3>
            <p className="text-xs text-muted-foreground">
              La version {formatVersion(update.version)} est prête à installer.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setDismissed(true)}
            disabled={downloading}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {downloading && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {downloadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => void downloadAndInstall()}
            disabled={downloading}
            size="sm"
            className="flex-1 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Installation…" : "Installer et redémarrer"}
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            disabled={downloading}
            variant="outline"
            size="sm"
          >
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}
