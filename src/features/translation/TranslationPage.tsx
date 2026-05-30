import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "@/features/translation/useTranslation";
import { TranslationVersionRow } from "@/features/translation/components/TranslationVersionRow";

export default function TranslationPage() {
  const vm = useTranslation();

  return (
    <PageMotion className="px-4">
      {vm.hasVersions && vm.paths && vm.translationsSelected !== null ? (
        <>
          <div className="flex shrink-0 flex-col gap-2 pt-2">
            <PageHeader
              icon={<IconLanguage className="h-6 w-6" />}
              title="Gestionnaire de traduction"
              description="Gérez les traductions de Star Citizen"
            />

            <div className="grid grid-cols-12 gap-5 pr-1">
              <p className="col-span-1 font-bold">Version</p>
              <p className="col-span-2 text-center font-bold">Chemin</p>
              <p className="col-span-3 flex items-center justify-center gap-1 text-center font-bold">
                Paramètres
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Langue des paramètres du jeu</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="col-span-2 text-center font-bold">État</p>
              <p className="col-span-4 text-end font-bold">Action</p>
            </div>
          </div>

          <div className={`${PAGE_SCROLL} flex flex-col gap-2 pb-4 pr-1 pt-2`}>
            {Object.entries(vm.paths.versions).map(([key, value], index) => (
              <TranslationVersionRow
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
            ))}
          </div>
        </>
      ) : (
        <div className={PAGE_CENTER}>
          <h2 className="mb-2 text-3xl font-bold">
            Aucune version du jeu n{"'"}a été trouvée
          </h2>
          <p className="max-w-[500px] text-center leading-7">
            Pour régler ce problème, lancez Star Citizen, puis rechargez cette
            page en faisant la manipulation suivante :
            <span className="ml-2 bg-gray-500 px-2 py-1">CRTL + R</span>
          </p>
        </div>
      )}
    </PageMotion>
  );
}
