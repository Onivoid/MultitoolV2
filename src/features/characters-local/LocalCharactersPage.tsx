import { IconUsers } from "@tabler/icons-react";
import { DataTable } from "@/shared/components/DataTable";
import FetchingOverlay from "@/shared/components/FetchingOverlay";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
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
      <div className="flex h-screen w-full items-center justify-center">
        <p>Recherche des installations de Star Citizen...</p>
      </div>
    );
  }

  if (isLoading) {
    return <FetchingOverlay />;
  }

  return (
    <PageMotion className="flex flex-col w-full max-h-[calc(100vh-50px)]">
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
