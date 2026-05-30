import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { UpdatePanel } from "@/features/update/components/UpdatePanel";
import { useUpdate } from "@/features/update/useUpdate";
import { useVersionChangelogs } from "@/features/update/useVersionChangelogs";

export default function UpdatePage() {
  const vm = useUpdate();
  const { buildInfo } = vm;
  const changelogs = useVersionChangelogs(
    vm.currentVersion,
    vm.update?.version ?? null,
  );

  if (buildInfo === null) {
    return (
      <PageMotion className="px-4 pt-2">
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Préparation de la vérification…" />
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion className="px-4 pt-2">
      <div className={`${PAGE_CENTER} pb-20`}>
        <UpdatePanel
          status={vm.status}
          update={vm.update}
          currentVersion={vm.currentVersion}
          error={vm.error}
          downloading={vm.downloading}
          downloadProgress={vm.downloadProgress}
          buildInfo={buildInfo}
          canUseUpdater={vm.canUseUpdater}
          installedChangelog={changelogs.installedChangelog}
          availableChangelog={changelogs.availableChangelog}
          changelogsLoading={changelogs.isLoading}
          onCheck={vm.runCheck}
          onDownloadAndInstall={vm.downloadAndInstall}
        />
      </div>
    </PageMotion>
  );
}
