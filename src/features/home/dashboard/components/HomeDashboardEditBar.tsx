import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HOME_WIDGET_REGISTRY } from "@/features/home/dashboard/homeDashboard.registry";
import type { HomeWidgetInstance } from "@/features/home/dashboard/homeDashboard.types";
import type { HomeWidgetType } from "@/features/home/dashboard/homeDashboard.types";
import { cn } from "@/lib/utils";

export interface HomeDashboardEditBarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  widgets: HomeWidgetInstance[];
  onAddWidget: (type: HomeWidgetType) => void;
  className?: string;
}

export function HomeDashboardEditBar({
  editMode,
  onToggleEditMode,
  widgets,
  onAddWidget,
  className,
}: HomeDashboardEditBarProps) {
  const presentTypes = new Set(widgets.map((w) => w.type));
  const available = HOME_WIDGET_REGISTRY.filter((w) => !presentTypes.has(w.type));

  return (
    <div
      className={cn(
        "pointer-events-auto z-20 flex flex-wrap items-center justify-center gap-2",
        className,
      )}
      data-no-window-drag
    >
      <Button
        type="button"
        variant={editMode ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-pressed={editMode}
        onClick={onToggleEditMode}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        {editMode ? "Terminer" : "Personnaliser"}
      </Button>

      {editMode && available.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Ajouter un widget
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 border-primary/12 bg-popover/95 p-2"
            align="center"
            side="top"
          >
            <ul className="flex flex-col gap-1">
              {available.map((def) => {
                const Icon = def.icon;
                return (
                  <li key={def.type}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-primary/10"
                      onClick={() => onAddWidget(def.type)}
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium">{def.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {def.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      )}

      {editMode && available.length === 0 && (
        <span className="text-ui-secondary text-muted-foreground">
          Tous les widgets sont déjà affichés.
        </span>
      )}
    </div>
  );
}
