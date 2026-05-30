import { Loader2, RefreshCw, ExternalLink, Newspaper, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { useNews } from "@/features/news/useNews";
import {
  extractThumbnail,
  extractTitleFromUrl,
  formatNewsDate,
} from "@/features/news/news.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";

export default function NewsPage() {
  const { news, isLoading, isRefreshing, refresh } = useNews();

  return (
    <PageMotion className="px-4 pt-2">
      <div className="flex shrink-0 items-center justify-between">
        <PageHeader
          icon={<Newspaper className="h-6 w-6" />}
          title="News Star Citizen"
          description="Dernières actualités officielles de Roberts Space Industries"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Rafraîchir
        </Button>
      </div>

      {isLoading ? (
        <div className={PAGE_CENTER}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : news.length === 0 ? (
        <div className={`${PAGE_CENTER} text-muted-foreground`}>
          Aucune news disponible
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} pb-4 pt-4`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {news.map((item) => {
              const { url: thumbUrl, isVideo } = extractThumbnail(
                item.content_html,
                item.tags,
              );
              const title = extractTitleFromUrl(item.url);

              return (
                <Card
                  key={item.id}
                  className="group flex h-[340px] cursor-pointer flex-col overflow-hidden bg-background/40 transition-colors hover:bg-background/60"
                  onClickCapture={() => openExternalUrl(item.url)}
                  role="link"
                >
                  <div className="pointer-events-none relative h-40 w-full shrink-0 overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/20">
                        {isVideo ? (
                          <Play className="h-10 w-10 text-muted-foreground" />
                        ) : (
                          <Newspaper className="h-10 w-10 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                    {isVideo && thumbUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-10 w-10 fill-white/90 text-white/90" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pointer-events-none flex min-h-0 flex-1 flex-col p-4 pt-3">
                    <div className="mb-2 flex shrink-0 items-center gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatNewsDate(item.date_published)}
                      </span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 shrink-0 text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                      {title}
                    </h3>
                    <p className="line-clamp-3 flex-1 text-xs text-muted-foreground">
                      {item.summary || "\u00A0"}
                    </p>
                    <div className="mt-auto flex shrink-0 items-center gap-1 pt-2 text-xs text-primary">
                      <ExternalLink className="h-3 w-3" />
                      Ouvrir sur RSI
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageMotion>
  );
}
