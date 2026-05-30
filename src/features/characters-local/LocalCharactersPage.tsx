import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { getFeatureCardsLayoutClass } from "@/shared/components/pageLayout";
import { LocalCharacterCard } from "@/features/characters-local/components/LocalCharacterCard";
import { useLocalCharacters } from "@/features/characters-local/useLocalCharacters";
import { useLocalCharactersActions } from "@/features/characters-local/useLocalCharactersActions";

export default function LocalCharactersPage() {
  const {
    gamePaths,
    pathsLoading,
    localCharacters,
    isLoading,
    versionOrder,
    refreshLocalCharacters,
  } = useLocalCharacters();
  const actions = useLocalCharactersActions();

  const isPageLoading = pathsLoading || !gamePaths || isLoading;

  if (isPageLoading) {
    return (
      <PageMotion className="px-4">
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Recherche des presets locaux…" />
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion className="px-4">
      <div className={`${PAGE_CENTER} pb-20`}>
        {localCharacters.length > 0 ? (
          <div className={getFeatureCardsLayoutClass()}>
            {localCharacters.map((character, index) => (
              <LocalCharacterCard
                key={character.name}
                character={character}
                versionOrder={versionOrder}
                index={index}
                actions={actions}
                onRefresh={refreshLocalCharacters}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 text-center">
            <p className="text-lg font-semibold text-foreground">Aucun preset local</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Aucun personnage personnalisé n&apos;a été trouvé sur vos installations
              Star Citizen.
            </p>
          </div>
        )}
      </div>
    </PageMotion>
  );
}
