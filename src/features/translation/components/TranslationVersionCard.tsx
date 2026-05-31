import { motion } from "framer-motion";
import {
  Loader2,
  XCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TranslationsChoosen } from "@/types/translation";
import { cn } from "@/lib/utils";
import { TranslationLanguageToggle } from "@/features/translation/components/TranslationLanguageToggle";
import {
  formatLastUpdated,
  isLiveVersionKey,
  TRANSLATION_CARD_WIDTH_CLASS,
} from "@/features/translation/translation.lib";

interface TranslationVersionCardProps {
  versionKey: string;
  version: {
    path: string;
    translated: boolean;
    up_to_date: boolean;
  };
  index: number;
  translationsSelected: TranslationsChoosen;
  loadingButtonId: string | null;
  onSettingsToggle: (version: string, settingsEN: boolean) => void;
  onInstall: (path: string, version: string) => void;
  onUpdate: (path: string, link: string, version: string) => void;
  onUninstall: (path: string) => void;
  setLoadingButtonId: (id: string | null) => void;
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
      <Badge variant="default" className="gap-1 text-[11px]">
        <CheckCircle className="h-3 w-3" />À jour
      </Badge>
    );
  }
  if (translated) {
    return (
      <Badge variant="default" className="gap-1 text-[11px]">
        <AlertCircle className="h-3 w-3" />
        Obsolète
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[11px]">
      <XCircle className="h-3 w-3" />
      Non installé
    </Badge>
  );
}

function VersionNotice({ versionKey }: { versionKey: string }) {
  const isLive = isLiveVersionKey(versionKey);

  if (isLive) {
    return (
      <div
        className="flex gap-2 rounded-md border border-primary/20 bg-primary/8 px-2.5 py-2"
        data-no-window-drag
      >
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Version publique : la traduction est maintenue et visée comme complète pour
          cette branche.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-2.5 py-2"
      data-no-window-drag
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Version de test : la traduction n&apos;est pas forcément complète et des
        problèmes peuvent survenir.
      </p>
    </div>
  );
}

export function TranslationVersionCard({
  versionKey,
  version,
  index,
  translationsSelected,
  loadingButtonId,
  onSettingsToggle,
  onInstall,
  onUpdate,
  onUninstall,
  setLoadingButtonId,
}: TranslationVersionCardProps) {
  const settings = translationsSelected[versionKey as keyof TranslationsChoosen];
  const isBusy = loadingButtonId !== null;
  const lastUpdatedLabel = formatLastUpdated(
    settings?.lastUpdatedAt,
    version.translated,
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.08 + index * 0.06 }}
      className={cn(
        "settings-section flex shrink-0 flex-col overflow-hidden",
        TRANSLATION_CARD_WIDTH_CLASS,
      )}
      data-no-window-drag
    >
      <header className="settings-section-header flex items-center justify-between gap-2 px-3 py-2 pl-3">
        <h3 className="text-sm font-semibold leading-tight">{versionKey}</h3>
        <StatusBadge translated={version.translated} upToDate={version.up_to_date} />
      </header>

      <div className="space-y-3 px-3 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="truncate text-xs text-muted-foreground">{version.path}</p>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm break-all">
            {version.path}
          </TooltipContent>
        </Tooltip>

        <VersionNotice versionKey={versionKey} />

        <TranslationLanguageToggle
          settingsEN={settings?.settingsEN === true}
          loading={loadingButtonId === `switch-${versionKey}`}
          disabled={isBusy}
          onChange={(settingsEN) => onSettingsToggle(versionKey, settingsEN)}
        />

        <p className="text-xs text-muted-foreground">
          {settings?.lastUpdatedAt || version.translated ? (
            <>
              Dernière mise à jour :{" "}
              <span className="text-foreground/80">{lastUpdatedLabel}</span>
            </>
          ) : (
            lastUpdatedLabel
          )}
        </p>

        <div className="flex flex-col gap-2 pt-0.5">
          {!version.translated && (
            <Button
              size="sm"
              className="w-full"
              disabled={loadingButtonId === `install-${versionKey}`}
              onClick={() => onInstall(version.path, versionKey)}
            >
              {loadingButtonId === `install-${versionKey}` ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Installation...
                </>
              ) : (
                "Installer"
              )}
            </Button>
          )}

          {version.translated && !version.up_to_date && settings?.link && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={loadingButtonId === `update-${versionKey}`}
              onClick={() => onUpdate(version.path, settings.link!, versionKey)}
            >
              {loadingButtonId === `update-${versionKey}` ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour"
              )}
            </Button>
          )}

          {version.translated && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={loadingButtonId === `uninstall-${versionKey}`}
              onClick={async () => {
                setLoadingButtonId(`uninstall-${versionKey}`);
                try {
                  await onUninstall(version.path);
                } finally {
                  setLoadingButtonId(null);
                }
              }}
            >
              {loadingButtonId === `uninstall-${versionKey}` ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Désinstallation...
                </>
              ) : (
                "Désinstaller"
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
