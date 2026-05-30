import { motion } from "framer-motion";
import { ExternalLink, Newspaper, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsItem } from "@/features/news/news.service";
import {
  extractThumbnail,
  extractTitleFromUrl,
  formatNewsDate,
} from "@/features/news/news.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

export function NewsCard({ item, index }: NewsCardProps) {
  const { url: thumbUrl, isVideo } = extractThumbnail(
    item.content_html,
    item.tags,
  );
  const title = extractTitleFromUrl(item.url);

  const openArticle = () => openExternalUrl(item.url);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 12) * 0.04 }}
      className="settings-section group flex h-[340px] cursor-pointer flex-col overflow-hidden"
      onClick={openArticle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openArticle();
        }
      }}
      role="link"
      tabIndex={0}
      data-no-window-drag
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-primary/5">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isVideo ? (
              <Play className="h-10 w-10 text-muted-foreground" />
            ) : (
              <Newspaper className="h-10 w-10 text-muted-foreground/50" />
            )}
          </div>
        )}
        {isVideo && thumbUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30">
            <Play className="h-10 w-10 fill-foreground/90 text-foreground/90" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[11px]">
              {tag}
            </Badge>
          ))}
          <time
            dateTime={item.date_published}
            className="ml-auto shrink-0 text-[11px] text-muted-foreground"
          >
            {formatNewsDate(item.date_published)}
          </time>
        </div>

        <h3 className="mb-2 line-clamp-2 shrink-0 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {title}
        </h3>

        <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {item.summary || "\u00A0"}
        </p>

        <div className="mt-auto flex shrink-0 items-center gap-1 pt-2 text-xs font-medium text-primary">
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir sur RSI
        </div>
      </div>
    </motion.article>
  );
}
