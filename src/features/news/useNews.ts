import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { newsService, type NewsItem } from "@/features/news/news.service";
import logger from "@/utils/logger";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchNews = useCallback(
    async (silent = false) => {
      try {
        const data = await newsService.fetchFeed();
        setNews(data.items || []);
        if (!silent) {
          toastSuccess(
            toast,
            "News mises à jour",
            `${data.items?.length || 0} articles chargés`,
          );
        }
      } catch (error) {
        logger.error("Erreur lors du chargement des news:", error);
        toastError(
          toast,
          "Erreur",
          "Impossible de charger les news Star Citizen",
        );
      }
    },
    [toast],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchNews(true).finally(() => setIsLoading(false));
  }, [fetchNews]);

  const refresh = async () => {
    setIsRefreshing(true);
    await fetchNews(false);
    setIsRefreshing(false);
  };

  return { news, isLoading, isRefreshing, refresh };
}
