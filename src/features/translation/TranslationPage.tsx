import { useEffect, useState } from "react";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import { useTranslation } from "@/features/translation/useTranslation";
import { TranslationVersionCard } from "@/features/translation/components/TranslationVersionCard";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import {
  getTranslationCardsLayoutClass,
  TRANSLATION_LOAD_DELAY_MS,
} from "@/features/translation/translation.lib";

function TranslationEmptyState() {
  return (
    <div className={`${PAGE_CENTER} px-4 pb-20 text-center`}>
      <p className="text-lg font-semibold text-foreground">
        Aucune version du jeu détectée
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Lancez Star Citizen au moins une fois, puis rechargez cette page avec{" "}
        <kbd className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-foreground">
          Ctrl + R
        </kbd>
        .
      </p>
    </div>
  );
}

export default function TranslationPage() {
  const vm = useTranslation();
  const [loadDelayElapsed, setLoadDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setLoadDelayElapsed(true),
      TRANSLATION_LOAD_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  const pipelineComplete = vm.initialLoadComplete;
  const isReady =
    pipelineComplete &&
    vm.hasVersions &&
    vm.paths &&
    vm.translationsSelected !== null &&
    vm.versionOrder.length > 0;
  const showEmpty = pipelineComplete && loadDelayElapsed && !vm.hasVersions;

  return (
    <PageMotion className="px-4">
      {isReady ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <div className={getTranslationCardsLayoutClass()}>
            {vm.versionOrder.map((key, index) => {
              const value = vm.paths!.versions[key];
              if (!value) return null;

              return (
                <TranslationVersionCard
                  key={key}
                  versionKey={key}
                  version={value}
                  index={index}
                  translationsSelected={vm.translationsSelected!}
                  loadingButtonId={vm.loadingButtonId}
                  onSettingsToggle={vm.handleSettingsToggle}
                  onInstall={vm.handleInstallTranslation}
                  onUpdate={vm.handleUpdateTranslation}
                  onUninstall={vm.handleUninstallTranslation}
                  setLoadingButtonId={vm.setLoadingButtonId}
                />
              );
            })}
          </div>
        </div>
      ) : showEmpty ? (
        <TranslationEmptyState />
      ) : (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement des traductions…" />
        </div>
      )}
    </PageMotion>
  );
}
