import { CLASS_LABEL_FR } from "@/features/blueprints/blueprints.catalog.lib";
import type { BlueprintClassCode } from "@/features/blueprints/blueprints.catalog.types";
import type { BlueprintCatalogFilterState } from "@/features/blueprints/blueprints.catalog.filters";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";
import {
  applyFamilyQuickFilterChange,
  buildQuickOutputTypeFacets,
  showComponentQuickFilters,
} from "@/features/blueprints/blueprints.quickFilters.lib";
import { BlueprintFamilyRail } from "@/features/blueprints/components/BlueprintFamilyRail";
import type { BlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";
import { bpFilterChip } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const QUICK_SIZES = [1, 2, 3] as const;
const QUICK_CLASSES: BlueprintClassCode[] = ["civi", "mili", "stlh"];
const QUICK_GRADES = ["A", "B", "C"] as const;

export interface BlueprintsQuickFilterBarProps {
  state: BlueprintCatalogFilterState;
  onChange: (state: BlueprintCatalogFilterState) => void;
  catalog: BlueprintCatalogSummary[];
  familyCounts?: Partial<Record<BlueprintFamily | "all", number>>;
}

function toggleInList<T extends string | number>(list: T[], value: T): T[] {
  const set = new Set(list);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].sort() as T[];
}

function toggleOutputTypeLabel(labels: string[], label: string): string[] {
  const set = new Set(labels);
  if (set.has(label)) set.delete(label);
  else set.add(label);
  return [...set].sort();
}

export function BlueprintsQuickFilterBar({
  state,
  onChange,
  catalog,
  familyCounts,
}: BlueprintsQuickFilterBarProps) {
  const componentFilters = showComponentQuickFilters(state.family);
  const outputTypeFacets = useMemo(
    () => buildQuickOutputTypeFacets(catalog, state.family),
    [catalog, state.family],
  );

  const handleFamilyChange = (family: BlueprintFamily | "all") => {
    onChange(applyFamilyQuickFilterChange(state, family));
  };

  return (
    <section
      className="settings-section shrink-0 space-y-2 px-3 py-2"
      data-no-window-drag
    >
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Catégorie
        </p>
        <BlueprintFamilyRail
          value={state.family}
          onChange={handleFamilyChange}
          counts={familyCounts}
        />
      </div>

      {componentFilters ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterRow label="Taille">
            <Chip
              active={state.sizes.length === 0}
              onClick={() => onChange({ ...state, sizes: [] })}
            >
              Tous
            </Chip>
            {QUICK_SIZES.map((size) => (
              <Chip
                key={size}
                active={state.sizes.includes(size)}
                onClick={() =>
                  onChange({ ...state, sizes: toggleInList(state.sizes, size) })
                }
              >
                T{size}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Classe">
            <Chip
              active={state.classCodes.length === 0}
              onClick={() => onChange({ ...state, classCodes: [] })}
            >
              Toutes
            </Chip>
            {QUICK_CLASSES.map((code) => (
              <Chip
                key={code}
                active={state.classCodes.includes(code)}
                onClick={() =>
                  onChange({
                    ...state,
                    classCodes: toggleInList(state.classCodes, code),
                  })
                }
                className={cn(
                  code === "civi" &&
                    state.classCodes.includes(code) &&
                    "border-sky-500/40",
                  code === "mili" &&
                    state.classCodes.includes(code) &&
                    "border-red-500/40",
                  code === "stlh" &&
                    state.classCodes.includes(code) &&
                    "border-violet-500/40",
                )}
              >
                {CLASS_LABEL_FR[code] ?? code}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Grade">
            <Chip
              active={state.grades.length === 0}
              onClick={() => onChange({ ...state, grades: [] })}
            >
              Toutes
            </Chip>
            {QUICK_GRADES.map((grade) => (
              <Chip
                key={grade}
                active={state.grades.includes(grade)}
                onClick={() =>
                  onChange({ ...state, grades: toggleInList(state.grades, grade) })
                }
              >
                {grade}
              </Chip>
            ))}
          </FilterRow>
        </div>
      ) : outputTypeFacets.length > 0 ? (
        <FilterRow label="Type d'objet">
          <Chip
            active={state.outputTypeLabels.length === 0}
            onClick={() => onChange({ ...state, outputTypeLabels: [] })}
          >
            Tous
          </Chip>
          {outputTypeFacets.map((facet) => (
            <Chip
              key={facet.value}
              active={state.outputTypeLabels.includes(facet.value)}
              onClick={() =>
                onChange({
                  ...state,
                  outputTypeLabels: toggleOutputTypeLabel(
                    state.outputTypeLabels,
                    facet.value,
                  ),
                })
              }
            >
              {facet.label}
              <span className="ml-1 tabular-nums text-muted-foreground">
                ({facet.count})
              </span>
            </Chip>
          ))}
        </FilterRow>
      ) : null}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}:
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(bpFilterChip(active), "px-2 py-1 text-[11px]", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
