import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { TranslationWidgetVersionRow } from "@/features/home/dashboard/widgets/TranslationWidgetVersionRow";
import { useTranslationWidget } from "@/features/translation/hooks/useTranslationWidget";
import {
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";

export function TranslationWidgetContent() {
  const {
    paths,
    versionOrder,
    translationsSelected,
    loading,
    error,
    hasVersions,
    loadingButtonId,
    handleInstallTranslation,
    handleUpdateTranslation,
  } = useTranslationWidget();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-xs text-destructive">{error}</p>;
  }

  if (!hasVersions || !paths || !translationsSelected) {
    return (
      <p className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">
        Aucune installation Star Citizen détectée.{" "}
        <Link to="/traduction" className="text-primary hover:underline">
          Ouvrir la page traduction
        </Link>
      </p>
    );
  }

  return (
    <div className={`${HOME_WIDGET_ROOT} ${HOME_WIDGET_SCROLL}`} data-no-window-drag>
      {versionOrder.map((key) => {
        const version = paths.versions[key];
        if (!version) {
          return null;
        }
        return (
          <TranslationWidgetVersionRow
            key={key}
            versionKey={key}
            version={version}
            settings={translationsSelected[key]}
            loadingButtonId={loadingButtonId}
            onInstall={(path, v) => void handleInstallTranslation(path, v)}
            onUpdate={(path, link, v) => void handleUpdateTranslation(path, link, v)}
          />
        );
      })}
    </div>
  );
}
