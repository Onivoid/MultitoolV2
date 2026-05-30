import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "@/features/translation/useTranslation";
import { TranslationVersionRow } from "@/features/translation/components/TranslationVersionRow";

export default function TranslationPage() {
  const vm = useTranslation();

  return (
    <PageMotion className="flex flex-col w-full max-h-[calc(100vh-50px)]">
      {vm.hasVersions && vm.paths && vm.translationsSelected !== null ? (
        <div className="w-full max-w-full flex flex-col gap-2 mt-5 overflow-y-scroll overflow-x-hidden pr-3 pb-3">
          <PageHeader
            icon={<IconLanguage className="h-6 w-6" />}
            title="Gestionnaire de traduction"
            description="Gérez les traductions de Star Citizen"
          />

          <div className="grid grid-cols-12 pr-4 gap-5">
            <p className="col-span-1 font-bold">Version</p>
            <p className="col-span-2 text-center font-bold">Chemin</p>
            <p className="col-span-3 text-center font-bold flex items-center justify-center gap-1">
              Paramètres
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Langue des paramètres du jeu</p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="col-span-2 text-center font-bold">État</p>
            <p className="col-span-4 text-end font-bold">Action</p>
          </div>

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
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <h2 className="text-3xl font-bold mb-2">
            Aucune version du jeu n{"'"}a été trouvée
          </h2>
          <p className="max-w-[500px] text-center leading-7">
            Pour régler ce problème, lancez Star Citizen, puis rechargez cette
            page en faisant la manipulation suivante :
            <span className="bg-gray-500 px-2 py-1 ml-2">CRTL + R</span>
          </p>
        </div>
      )}
    </PageMotion>
  );
}
