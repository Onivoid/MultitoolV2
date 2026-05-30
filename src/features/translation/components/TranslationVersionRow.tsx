import { motion } from "framer-motion";
import {
  Loader2,
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TranslationsChoosen } from "@/types/translation";

interface TranslationVersionRowProps {
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

export function TranslationVersionRow({
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
}: TranslationVersionRowProps) {
  const settings = translationsSelected[versionKey as keyof TranslationsChoosen];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 + index * 0.2 }}
      className="w-full"
    >
      <div className="w-full rounded-lg border border-primary/50 bg-card/50 hover:bg-card/60 shadow-sm p-2 duration-150 ease-in-out">
        <div className="grid grid-cols-12 gap-2">
          <div className="flex justify-start items-center col-span-1">
            <p className="font-medium text-sm">{versionKey}</p>
          </div>

          <div className="flex justify-start items-center col-span-2 truncate">
            <Tooltip>
              <TooltipTrigger className="hover:cursor-default">
                <p className="text-sm text-muted-foreground">{version.path}...</p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm text-muted-foreground">{version.path}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex justify-center items-center gap-2 col-span-3">
            <span className="text-sm">Français</span>
            {loadingButtonId === `switch-${versionKey}` ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Switch
                checked={settings?.settingsEN === true}
                onCheckedChange={(checked) => onSettingsToggle(versionKey, checked)}
                disabled={loadingButtonId !== null}
              />
            )}
            <span className="text-sm">Anglais</span>
          </div>

          <div className="flex items-center justify-start col-span-2">
            {version.up_to_date ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                À jour
              </Badge>
            ) : version.translated ? (
              <Badge variant="default" className="gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Obsolète
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Non installé
              </Badge>
            )}
          </div>

          <div className="flex justify-end items-center gap-2 col-span-4">
            {!version.translated && (
              <Button
                size="sm"
                disabled={loadingButtonId === `install-${versionKey}`}
                onClick={() => onInstall(version.path, versionKey)}
              >
                {loadingButtonId === `install-${versionKey}` ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Installation...
                  </>
                ) : (
                  "Installer"
                )}
              </Button>
            )}
            {version.translated &&
              !version.up_to_date &&
              settings?.link && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loadingButtonId === `update-${versionKey}`}
                  onClick={() =>
                    onUpdate(version.path, settings.link!, versionKey)
                  }
                >
                  {loadingButtonId === `update-${versionKey}` ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
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
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Désinstallation...
                  </>
                ) : (
                  "Désinstaller"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
