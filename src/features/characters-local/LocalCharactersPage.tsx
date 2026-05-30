import { IconUsers } from "@tabler/icons-react";
import { DataTable } from "@/shared/components/DataTable";
import FetchingOverlay from "@/shared/components/FetchingOverlay";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import { buildLocalCharactersColumns } from "@/features/characters-local/components/localCharactersColumns";
import { useLocalCharacters } from "@/features/characters-local/useLocalCharacters";
import { useLocalCharactersActions } from "@/features/characters-local/useLocalCharactersActions";

export default function LocalCharactersPage() {
  const {
    gamePaths,
    pathsLoading,
    localCharacters,
    isLoading,
    availableVersions,
    refreshLocalCharacters,
  } = useLocalCharacters();
  const actions = useLocalCharactersActions();

  if (pathsLoading || !gamePaths) {
    return (
      <PageMotion>
        <div className={PAGE_CENTER}>
          <p>Recherche des installations de Star Citizen...</p>
        </div>
      </PageMotion>
    );
  }

  if (isLoading) {
    return <FetchingOverlay />;
  }

  return (
    <PageMotion className="gap-4 px-4 pt-2">
      <PageHeader
        icon={<IconUsers className="h-6 w-6" />}
        title="Gestionnaire de presets de Personnages"
        description="Gérez vos presets de personnages locaux"
      />

      <DataTable
        columns={buildLocalCharactersColumns(
          actions,
          refreshLocalCharacters,
          availableVersions,
        )}
        data={localCharacters}
        emptyMessage="Aucun personnage local trouvé."
      />
    </PageMotion>
  );
}
