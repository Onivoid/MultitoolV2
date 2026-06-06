import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { newsService, type NewsItem } from "@/features/news/news.service";
import {
  extractThumbnail,
  extractTitleFromUrl,
  formatNewsDate,
} from "@/features/news/news.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";

const PREVIEW_COUNT = 5;

export function NewsWidgetContent() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const feed = await newsService.fetchFeed();
        if (!cancelled) {
          setItems((feed.items ?? []).slice(0, PREVIEW_COUNT));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-ui-caption text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="px-3 py-3 text-ui-caption text-muted-foreground">
        Aucune actualité disponible.
      </p>
    );
  }

  return (
    <ul className="max-h-[160px] overflow-y-auto" data-no-window-drag>
      {items.map((item) => {
        const title =
          item.summary?.trim() || extractTitleFromUrl(item.url) || "Actualité RSI";
        const { url: thumb } = extractThumbnail(item.content_html, item.tags);
        return (
          <li key={item.id} className="border-b border-primary/6 last:border-b-0">
            <button
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-primary/5"
              onClick={() => void openExternalUrl(item.url)}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="mt-0.5 h-9 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="mt-0.5 h-9 w-12 shrink-0 rounded bg-primary/10" />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-ui-secondary line-clamp-2 font-medium leading-snug">
                  {title}
                </span>
                <span className="text-ui-caption mt-0.5 block text-muted-foreground">
                  {formatNewsDate(item.date_published)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
