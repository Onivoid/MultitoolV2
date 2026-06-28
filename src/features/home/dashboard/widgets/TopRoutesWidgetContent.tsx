import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeRouteLabel } from "@/features/home/homeRouteLabels";
import { useTopRoutes } from "@/features/home/useTopRoutes";
import {
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";
import { cn } from "@/lib/utils";

export function TopRoutesWidgetContent() {
  const { routes, loading } = useTopRoutes(3);

  return (
    <div
      className={`${HOME_WIDGET_ROOT} ${HOME_WIDGET_SCROLL} flex-col gap-1 px-2 py-2`}
    >
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}

      {!loading && routes.length === 0 && (
        <p className="px-1 py-2 text-xs leading-relaxed text-muted-foreground">
          Parcourez l&apos;app pour voir vos raccourcis ici.
        </p>
      )}

      {!loading &&
        routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={cn(
              "settings-link-block group flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
            )}
          >
            <span className="min-w-0 truncate font-medium">
              {getHomeRouteLabel(route.path)}
            </span>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
    </div>
  );
}
