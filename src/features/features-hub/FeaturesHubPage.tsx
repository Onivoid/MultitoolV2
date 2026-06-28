import { Link } from "react-router-dom";
import PageMotion from "@/shared/components/PageMotion";
import {
  allAppRoutes,
  featuresRouteGroups,
} from "@/components/navigation/navigation.config";
import type { NavRoute } from "@/components/navigation/navigation.config";
import { useAppNotifications } from "@/shared/hooks/useAppNotifications";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

function AppTile({
  path,
  label,
  description,
  icon: Icon,
  notify,
}: NavRoute & { notify?: boolean }) {
  return (
    <Link
      to={path}
      className={cn(
        "settings-link-block group relative flex h-full items-start gap-3 rounded-lg p-3",
        "transition-all duration-200",
        "hover:shadow-[0_0_24px_hsl(var(--primary)/0.1)]",
      )}
      data-no-window-drag
    >
      {notify ? (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
          aria-label="Mise à jour disponible"
        />
      ) : null}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          "border border-primary/15 bg-primary/10",
          "transition-colors group-hover:border-primary/30 group-hover:bg-primary/16",
        )}
      >
        {Icon ? (
          <Icon className="h-[18px] w-[18px] stroke-[2] text-primary" aria-hidden />
        ) : (
          <span className="text-sm font-semibold text-primary">{label[0]}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <span className="text-ui-body block font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {label}
        </span>
        {description ? (
          <span className="text-ui-secondary mt-1 block line-clamp-2 leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function CategoryCell({
  label,
  routes,
  routeBadges,
}: {
  label: string;
  routes: NavRoute[];
  routeBadges: Record<string, boolean>;
}) {
  if (routes.length === 0) return null;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-primary/15 p-4">
      <header className="mb-4 flex shrink-0 items-center gap-2 border-b border-primary/8 pb-3">
        <span className="h-4 w-0.5 shrink-0 rounded-full bg-primary/45" aria-hidden />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </h2>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-0.5">
        {routes.map((route) => (
          <AppTile key={route.path} {...route} notify={routeBadges[route.path]} />
        ))}
      </div>
    </section>
  );
}

export default function FeaturesHubPage() {
  const { routeBadges } = useAppNotifications();
  const hubSections = useMemo(() => {
    const inGroups = new Set(
      featuresRouteGroups.flatMap((g) => g.routes.map((r) => r.path)),
    );
    const extraRoutes = allAppRoutes.filter(
      (r) => !inGroups.has(r.path) && r.path !== "/fonctionnalites",
    );

    const sections = featuresRouteGroups.map((group) => ({
      label: group.label,
      routes: group.routes,
    }));

    if (extraRoutes.length > 0) {
      sections.push({ label: "Autres", routes: extraRoutes });
    }

    return sections;
  }, []);

  return (
    <PageMotion className="h-full min-h-0 w-full overflow-hidden p-4 pb-20">
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-4">
        {hubSections.map((section) => (
          <CategoryCell
            key={section.label}
            label={section.label}
            routes={section.routes}
            routeBadges={routeBadges}
          />
        ))}
      </div>
    </PageMotion>
  );
}
