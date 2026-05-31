import { useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeDashboardEditBar } from "@/features/home/dashboard/components/HomeDashboardEditBar";
import { HomeWidgetShell } from "@/features/home/dashboard/components/HomeWidgetShell";
import { getWidgetDefinition } from "@/features/home/dashboard/homeDashboard.registry";
import { useHomeDashboard } from "@/features/home/dashboard/useHomeDashboard";
import { cn } from "@/lib/utils";

export interface HomeDashboardProps {
  logoRef: React.RefObject<HTMLElement | null>;
}

export function HomeDashboard({ logoRef }: HomeDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    layout,
    loading,
    editMode,
    setEditMode,
    updateWidgetPosition,
    removeWidget,
    addWidget,
  } = useHomeDashboard();

  return (
    <>
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        aria-hidden={loading}
      >
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={i}
              className="absolute top-1/2 h-48 w-[min(280px,calc(100%-1rem))] -translate-y-1/2"
              style={{ left: i === 0 ? "2px" : "auto", right: i === 1 ? "2px" : "auto" }}
            />
          ))}

        {layout?.widgets.map((instance) => {
          if (!getWidgetDefinition(instance.type)) {
            return null;
          }
          return (
            <HomeWidgetShell
              key={instance.id}
              instance={instance}
              editMode={editMode}
              containerRef={containerRef}
              logoRef={logoRef}
              onPositionChange={updateWidgetPosition}
              onRemove={removeWidget}
            />
          );
        })}
      </div>

      <HomeDashboardEditBar
        className="absolute bottom-[22%] left-1/2 z-20 hidden -translate-x-1/2 md:flex"
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        widgets={layout?.widgets ?? []}
        onAddWidget={addWidget}
      />

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3 px-4 md:hidden">
        <p className="text-center text-xs text-muted-foreground">
          Les widgets personnalisables sont disponibles sur un écran plus large. Passez en
          mode bureau pour déplacer et organiser votre accueil.
        </p>
        {layout?.widgets.map((instance) => {
          const def = getWidgetDefinition(instance.type);
          if (!def) {
            return null;
          }
          const Icon = def.icon;
          const Content = def.Content;
          return (
            <div
              key={instance.id}
              className={cn("settings-section flex flex-col overflow-hidden")}
            >
              <header className="settings-section-header flex items-center gap-2 px-3 py-2 pl-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                </div>
                <h2 className="text-sm font-semibold">{def.label}</h2>
              </header>
              <Content />
            </div>
          );
        })}
      </div>
    </>
  );
}
