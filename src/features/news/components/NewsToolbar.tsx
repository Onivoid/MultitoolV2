import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NewsToolbarProps {
  articleCount: number;
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export function NewsToolbar({
  articleCount,
  isRefreshing,
  isLoading,
  onRefresh,
}: NewsToolbarProps) {
  return (
    <section
      className="settings-section mb-3 flex shrink-0 flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:justify-between"
      data-no-window-drag
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
          <Newspaper className="h-3.5 w-3.5 text-primary" />
          RSI
        </Badge>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Actualités officielles Star Citizen
          {articleCount > 0 && (
            <span className="text-foreground/80">
              {" "}
              · {articleCount} article{articleCount > 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 shrink-0 gap-1.5 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm"
        onClick={onRefresh}
        disabled={isRefreshing || isLoading}
        data-no-window-drag
      >
        <RefreshCw
          className={cn("h-4 w-4 shrink-0", isRefreshing && "animate-spin")}
        />
        Rafraîchir
      </Button>
    </section>
  );
}
