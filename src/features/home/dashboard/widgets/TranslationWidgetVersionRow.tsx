import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TranslationSetting } from "@/types/translation";
import { getWidgetAction } from "@/features/translation/translation.widget.lib";
import { canonicalVersionKey } from "@/features/translation/translation.lib";

export interface TranslationWidgetVersionRowProps {
  versionKey: string;
  version: {
    path: string;
    translated: boolean;
    up_to_date: boolean;
  };
  settings: TranslationSetting | null | undefined;
  loadingButtonId: string | null;
  onInstall: (path: string, version: string) => void;
  onUpdate: (path: string, link: string, version: string) => void;
}

function StatusBadge({
  translated,
  upToDate,
}: {
  translated: boolean;
  upToDate: boolean;
}) {
  if (upToDate) {
    return (
      <Badge variant="default" className="h-5 shrink-0 gap-0.5 px-1.5 text-[10px]">
        À jour
      </Badge>
    );
  }
  if (translated) {
    return (
      <Badge variant="secondary" className="h-5 shrink-0 gap-0.5 px-1.5 text-[10px]">
        Obsolète
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="h-5 shrink-0 gap-0.5 px-1.5 text-[10px]">
      Non installé
    </Badge>
  );
}

export function TranslationWidgetVersionRow({
  versionKey,
  version,
  settings,
  loadingButtonId,
  onInstall,
  onUpdate,
}: TranslationWidgetVersionRowProps) {
  const label = canonicalVersionKey(versionKey);
  const action = getWidgetAction(version);
  const installLoading = loadingButtonId === `install-${versionKey}`;
  const updateLoading = loadingButtonId === `update-${versionKey}`;

  return (
    <div
      className="flex items-center gap-2 border-b border-primary/6 px-3 py-2 last:border-b-0"
      data-no-window-drag
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{label}</span>
      <StatusBadge translated={version.translated} upToDate={version.up_to_date} />
      {action === "install" && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-6 shrink-0 px-2 text-[10px]"
          disabled={installLoading}
          onClick={() => onInstall(version.path, versionKey)}
        >
          {installLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            "Installer"
          )}
        </Button>
      )}
      {action === "update" && settings?.link && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-6 shrink-0 px-2 text-[10px]"
          disabled={updateLoading}
          onClick={() => onUpdate(version.path, settings.link!, versionKey)}
        >
          {updateLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            "MAJ"
          )}
        </Button>
      )}
    </div>
  );
}
