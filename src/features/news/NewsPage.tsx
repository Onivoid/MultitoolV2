import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { NewsCard } from "@/features/news/components/NewsCard";
import { NewsToolbar } from "@/features/news/components/NewsToolbar";
import { useNews } from "@/features/news/useNews";

const NEWS_GRID_CLASS = "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3";

export default function NewsPage() {
  const { news, isLoading, isRefreshing, refresh } = useNews();

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <NewsToolbar
        articleCount={news.length}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      {isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement des actualités RSI…" />
        </div>
      ) : news.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucune actualité disponible
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Impossible de récupérer le flux pour le moment. Réessayez avec Rafraîchir.
            </p>
          </section>
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} pb-20`}>
          <div className={NEWS_GRID_CLASS}>
            {news.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      )}
    </PageMotion>
  );
}
