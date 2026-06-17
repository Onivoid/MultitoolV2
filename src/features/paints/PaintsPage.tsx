import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { PaintCard } from "@/features/paints/components/PaintCard";
import { PaintsToolbar } from "@/features/paints/components/PaintsToolbar";
import { PAINTS_GRID } from "@/features/paints/paints.ui";
import { usePaintsCatalog } from "@/features/paints/usePaintsCatalog";

export default function PaintsPage() {
  const {
    paints,
    totalCount,
    isLoading,
    search,
    setSearch,
    activeEvent,
    toggleEvent,
    selectEvent,
    eventChips,
  } = usePaintsCatalog();

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <PaintsToolbar
        totalCount={totalCount}
        filteredCount={paints.length}
        search={search}
        onSearchChange={setSearch}
        eventChips={eventChips}
        activeEvent={activeEvent}
        onToggleEvent={toggleEvent}
        onSelectEvent={selectEvent}
      />

      {isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement du catalogue des peintures…" />
        </div>
      ) : paints.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucune peinture trouvée
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Essayez d&apos;autres termes de recherche ou retirez les filtres
              événement.
            </p>
          </section>
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} pb-20`}>
          <div className={PAINTS_GRID}>
            {paints.map((paint, index) => (
              <PaintCard key={paint.uuid} paint={paint} index={index} />
            ))}
          </div>
        </div>
      )}
    </PageMotion>
  );
}
