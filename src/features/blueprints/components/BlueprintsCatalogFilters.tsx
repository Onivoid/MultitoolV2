import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BlueprintFilterSelect } from "@/features/blueprints/components/BlueprintFilterSelect";
import {
  CLASS_LABEL_FR,
  filterValueToString,
  type CatalogSummaryFacets,
} from "@/features/blueprints/blueprints.catalog.lib";
import {
  countActiveFilters,
  DEFAULT_CATALOG_FILTER_STATE,
  type BlueprintCatalogFilterState,
} from "@/features/blueprints/blueprints.catalog.filters";
import type {
  BlueprintCatalogFilters,
  BlueprintClassCode,
  CatalogSortKey,
  WikiItemsFilters,
} from "@/features/blueprints/blueprints.catalog.types";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import type { BlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";
import { wikiItemsCategoryForFamily } from "@/features/blueprints/blueprints.taxonomy";
import { bpFilterChip } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: CatalogSortKey; label: string }[] = [
  { value: "nameFr", label: "Nom (FR) A→Z" },
  { value: "nameFrDesc", label: "Nom (FR) Z→A" },
  { value: "nameEn", label: "Nom (EN) A→Z" },
  { value: "nameEnDesc", label: "Nom (EN) Z→A" },
  { value: "category", label: "Catégorie" },
  { value: "unlockDate", label: "Date déblocage" },
  { value: "craftTime", label: "Temps de craft" },
  { value: "size", label: "Taille" },
  { value: "missions", label: "Missions" },
];

const CLASS_OPTIONS: BlueprintClassCode[] = ["civi", "mili", "indu", "stlh", "comp"];

const SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const GRADE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];

const ARMOR_WEIGHT_TOKENS: { token: string; label: string }[] = [
  { token: "_light_", label: "Light" },
  { token: "_medium_", label: "Medium" },
  { token: "_heavy_", label: "Heavy" },
];

const ARMOR_SLOT_TOKENS: { token: string; label: string }[] = [
  { token: "_helmet_", label: "Casque" },
  { token: "_torso_", label: "Torse" },
  { token: "_core_", label: "Torse" },
  { token: "_legs_", label: "Jambes" },
  { token: "_arms_", label: "Bras" },
  { token: "_gloves_", label: "Gants" },
  { token: "_feet_", label: "Pieds" },
  { token: "_backpack_", label: "Sac" },
  { token: "_undersuit_", label: "Combinaison" },
];

function familyShowsGrade(family: BlueprintFamily | "all"): boolean {
  return family === "all" || family === "ship_component";
}

function familyShowsSize(family: BlueprintFamily | "all"): boolean {
  return (
    family === "all" ||
    family === "ship_component" ||
    family === "ship_weapon" ||
    family === "mining"
  );
}

function familyShowsClass(family: BlueprintFamily | "all"): boolean {
  return (
    family === "all" ||
    family === "ship_component" ||
    family === "ship_weapon" ||
    family === "fps_weapon"
  );
}

function familyShowsManufacturer(family: BlueprintFamily | "all"): boolean {
  return family === "all" || family === "ship_component";
}

function familyShowsOutputTypes(family: BlueprintFamily | "all"): boolean {
  return family !== "armor";
}

function ActiveFilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs">
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-1.5"
        onClick={onClear}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

function familyShowsOutputTypeLabels(family: BlueprintFamily | "all"): boolean {
  return family === "ship_component";
}

function AdvancedFiltersBody({
  state,
  onChange,
  facets,
  summaryFacets,
  wikiItemsFilters,
  resourceSelectOptions,
  toggleOutputType,
  toggleOutputTypeLabel,
  toggleClass,
  toggleSize,
  toggleGrade,
  toggleManufacturer,
  toggleIdToken,
  toggleStarSystem,
  toggleJurisdiction,
  toggleContractor,
  toggleMissionType,
  unlockIndexReady,
}: {
  state: BlueprintCatalogFilterState;
  onChange: (s: BlueprintCatalogFilterState) => void;
  facets: BlueprintCatalogFilters | null;
  summaryFacets: CatalogSummaryFacets | null;
  wikiItemsFilters: WikiItemsFilters | null;
  resourceSelectOptions: { value: string; label: string }[];
  toggleOutputType: (value: string) => void;
  toggleOutputTypeLabel: (label: string) => void;
  toggleClass: (code: BlueprintClassCode) => void;
  toggleSize: (n: number) => void;
  toggleGrade: (letter: string) => void;
  toggleManufacturer: (code: string) => void;
  toggleIdToken: (token: string) => void;
  toggleStarSystem: (name: string) => void;
  toggleJurisdiction: (name: string) => void;
  toggleContractor: (name: string) => void;
  toggleMissionType: (name: string) => void;
  unlockIndexReady: boolean;
}) {
  const family = state.family;
  const armorOutputTypes =
    facets?.outputType.filter((f) =>
      filterValueToString(f.value).startsWith("Char_Armor"),
    ) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Tri
          </p>
          <BlueprintFilterSelect
            value={state.sort}
            onValueChange={(v) => onChange({ ...state, sort: v as CatalogSortKey })}
            options={SORT_OPTIONS}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Craft par défaut
          </p>
          <BlueprintFilterSelect
            value={state.defaultOwned}
            onValueChange={(v) =>
              onChange({
                ...state,
                defaultOwned: v as "all" | "yes" | "no",
              })
            }
            options={[
              { value: "all", label: "Tous" },
              { value: "yes", label: "Craftable par défaut" },
              { value: "no", label: "À débloquer" },
            ]}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Missions
          </p>
          <BlueprintFilterSelect
            value={state.hasMissions}
            onValueChange={(v) =>
              onChange({
                ...state,
                hasMissions: v as "all" | "yes" | "no",
              })
            }
            options={[
              { value: "all", label: "Toutes" },
              { value: "yes", label: "Avec missions" },
              { value: "no", label: "Sans mission" },
            ]}
          />
        </div>
      </div>
      {family === "armor" && (
        <>
          <div>
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">
              Classe armure
            </p>
            <div className="flex flex-wrap gap-1">
              {ARMOR_WEIGHT_TOKENS.map(({ token, label }) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => toggleIdToken(token)}
                  className={bpFilterChip(state.idTokens.includes(token))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">Slot</p>
            <div className="flex flex-wrap gap-1">
              {ARMOR_SLOT_TOKENS.map(({ token, label }) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => toggleIdToken(token)}
                  className={bpFilterChip(state.idTokens.includes(token))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {armorOutputTypes.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase text-muted-foreground">
                Type Wiki
              </p>
              <div className="flex flex-wrap gap-1">
                {armorOutputTypes.map((f) => {
                  const val = filterValueToString(f.value);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleOutputType(val)}
                      className={bpFilterChip(state.outputTypes.includes(val))}
                    >
                      {f.label} ({f.count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {familyShowsOutputTypes(family) && facets && facets.outputType.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">
            Type d&apos;objet
            {wikiItemsFilters && (
              <span className="ml-1 normal-case text-muted-foreground/80">
                (réf. Wiki : {wikiItemsFilters.type.length} types)
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1">
            {facets.outputType
              .filter((f) => {
                const val = filterValueToString(f.value).toUpperCase();
                const label = String(f.label).toUpperCase();
                return val !== "MISC" && !label.includes("MISC");
              })
              .map((f) => {
                const val = filterValueToString(f.value);
                const activeType = state.outputTypes.includes(val);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleOutputType(val)}
                    className={bpFilterChip(activeType)}
                  >
                    {f.label} ({f.count})
                  </button>
                );
              })}
          </div>
        </div>
      )}
      {familyShowsOutputTypeLabels(family) &&
        (summaryFacets?.outputTypeLabels.length ?? 0) > 0 && (
          <div>
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">
              Type affiché
            </p>
            <div className="flex flex-wrap gap-1">
              {summaryFacets!.outputTypeLabels.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleOutputTypeLabel(String(f.value))}
                  className={bpFilterChip(
                    state.outputTypeLabels.includes(String(f.value)),
                  )}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>
        )}
      {familyShowsGrade(family) && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Grade</p>
          <div className="flex flex-wrap gap-1">
            {GRADE_OPTIONS.map((g) => {
              const facet = summaryFacets?.grades.find((f) => f.value === g);
              const count = facet?.count ?? 0;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  disabled={summaryFacets != null && count === 0}
                  className={cn(
                    bpFilterChip(state.grades.includes(g)),
                    summaryFacets != null && count === 0 && "opacity-40",
                  )}
                  title={
                    summaryFacets != null && count === 0
                      ? "Aucun blueprint avec ce grade dans le catalogue"
                      : undefined
                  }
                >
                  {g}
                  {summaryFacets != null && count > 0 && (
                    <span className="ml-0.5 tabular-nums opacity-80">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {familyShowsManufacturer(family) &&
        (summaryFacets?.manufacturers.length ?? 0) > 0 && (
          <div>
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">
              Fabricant
            </p>
            <div className="flex flex-wrap gap-1">
              {summaryFacets!.manufacturers.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleManufacturer(f.value)}
                  className={bpFilterChip(state.manufacturerCodes.includes(f.value))}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>
        )}
      {familyShowsClass(family) && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Classe</p>
          <div className="flex flex-wrap gap-1">
            {CLASS_OPTIONS.map((c) => {
              const facet = summaryFacets?.classCodes.find((f) => f.value === c);
              const count = facet?.count ?? 0;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleClass(c)}
                  disabled={summaryFacets != null && count === 0}
                  className={cn(
                    bpFilterChip(state.classCodes.includes(c)),
                    summaryFacets != null && count === 0 && "opacity-40",
                  )}
                  title={
                    summaryFacets != null && count === 0
                      ? "Aucun blueprint avec cette classe dans le catalogue"
                      : undefined
                  }
                >
                  {CLASS_LABEL_FR[c]}
                  {summaryFacets != null && count > 0 && (
                    <span className="ml-0.5 tabular-nums opacity-80">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {familyShowsSize(family) && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Taille</p>
          <div className="flex flex-wrap gap-1">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={cn(bpFilterChip(state.sizes.includes(s)), "tabular-nums")}
              >
                T{s}
              </button>
            ))}
          </div>
        </div>
      )}
      {resourceSelectOptions.length > 1 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">
            Ingrédient / ressource
          </p>
          <BlueprintFilterSelect
            value={state.resourceUuid ?? "__none__"}
            onValueChange={(v) =>
              onChange({
                ...state,
                resourceUuid: v === "__none__" ? null : v,
                resourceUuidAliases: [],
                resourceFilterLabel: null,
              })
            }
            options={resourceSelectOptions}
            searchable
            className="w-full max-w-none"
          />
        </div>
      )}
      {(summaryFacets?.starSystems.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Système</p>
          <div className="flex flex-wrap gap-1">
            {summaryFacets!.starSystems.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() => toggleStarSystem(String(f.value))}
                className={bpFilterChip(state.starSystems.includes(String(f.value)))}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}
      {(summaryFacets?.jurisdictions.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Statut UEE</p>
          <div className="flex flex-wrap gap-1">
            {summaryFacets!.jurisdictions.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() => toggleJurisdiction(String(f.value))}
                className={bpFilterChip(state.jurisdictions.includes(String(f.value)))}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-1 text-[10px] uppercase text-muted-foreground">
          Légalité mission
        </p>
        <BlueprintFilterSelect
          value={state.lawful}
          onValueChange={(v) =>
            onChange({ ...state, lawful: v as "all" | "legal" | "illegal" })
          }
          options={[
            { value: "all", label: "Toutes" },
            { value: "legal", label: "Légal" },
            { value: "illegal", label: "Illégal" },
          ]}
        />
        {!unlockIndexReady && state.lawful !== "all" && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            Index de légalité en cours de construction — résultats partiels possibles.
            Réessayez dans quelques minutes ou rafraîchissez le catalogue.
          </p>
        )}
      </div>
      {(summaryFacets?.contractors.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Contractor</p>
          <div className="flex flex-wrap gap-1">
            {summaryFacets!.contractors.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() => toggleContractor(String(f.value))}
                className={bpFilterChip(state.contractors.includes(String(f.value)))}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}
      {(summaryFacets?.missionTypes.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">
            Type de mission
          </p>
          <div className="flex flex-wrap gap-1">
            {summaryFacets!.missionTypes.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() => toggleMissionType(String(f.value))}
                className={bpFilterChip(state.missionTypes.includes(String(f.value)))}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 self-start text-xs"
        onClick={() => onChange({ ...DEFAULT_CATALOG_FILTER_STATE })}
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );
}

export interface BlueprintsCatalogFiltersProps {
  state: BlueprintCatalogFilterState;
  onChange: (s: BlueprintCatalogFilterState) => void;
  facets: BlueprintCatalogFilters | null;
  summaryFacets?: CatalogSummaryFacets | null;
  missionFilterTitle?: string | null;
  onClearMissionFilter?: () => void;
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function BlueprintsCatalogFilters({
  state,
  onChange,
  facets,
  summaryFacets = null,
  missionFilterTitle,
  onClearMissionFilter,
  filtersOpen: filtersOpenProp,
  onFiltersOpenChange,
  hideTrigger = false,
}: BlueprintsCatalogFiltersProps) {
  const [filtersOpenInternal, setFiltersOpenInternal] = useState(false);
  const filtersOpen = filtersOpenProp ?? filtersOpenInternal;
  const setFiltersOpen = onFiltersOpenChange ?? setFiltersOpenInternal;
  const [wikiItemsFilters, setWikiItemsFilters] = useState<WikiItemsFilters | null>(
    null,
  );
  const [unlockIndexReady, setUnlockIndexReady] = useState(false);
  const active = countActiveFilters(state);

  const itemsFilterCategory = useMemo(() => {
    if (state.family === "all") return null;
    return wikiItemsCategoryForFamily(state.family);
  }, [state.family]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void blueprintsCatalogService
        .unlockIndexStatus()
        .then((status) => {
          if (!cancelled) setUnlockIndexReady(status.exists && !status.stale);
        })
        .catch(() => {
          if (!cancelled) setUnlockIndexReady(false);
        });
    };
    refresh();
    if (!unlockIndexReady && state.lawful !== "all") {
      const timer = window.setInterval(refresh, 15_000);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [unlockIndexReady, state.lawful]);

  useEffect(() => {
    if (!itemsFilterCategory) {
      setWikiItemsFilters(null);
      return;
    }
    let cancelled = false;
    void blueprintsCatalogService
      .wikiItemsFilters(itemsFilterCategory)
      .then((data) => {
        if (!cancelled) setWikiItemsFilters(data);
      })
      .catch(() => {
        if (!cancelled) setWikiItemsFilters(null);
      });
    return () => {
      cancelled = true;
    };
  }, [itemsFilterCategory]);

  const resourceSelectOptions = useMemo(() => {
    if (!facets) return [];
    const byValue = new Map<string, string>();
    const add = (list: typeof facets.resourceUuid) => {
      for (const f of list) {
        const val = filterValueToString(f.value);
        if (!val || byValue.has(val)) continue;
        byValue.set(val, `${f.label} (${f.count})`);
      }
    };
    add(facets.ingredientUuid);
    add(facets.resourceUuid);
    if (state.resourceUuid && !byValue.has(state.resourceUuid)) {
      byValue.set(state.resourceUuid, state.resourceFilterLabel ?? state.resourceUuid);
    }
    return [
      { value: "__none__", label: "Aucun filtre ressource" },
      ...[...byValue.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [facets, state.resourceUuid, state.resourceFilterLabel]);

  const toggleOutputType = (value: string) => {
    const set = new Set(state.outputTypes);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...state, outputTypes: [...set] });
  };

  const toggleOutputTypeLabel = (label: string) => {
    const set = new Set(state.outputTypeLabels);
    if (set.has(label)) set.delete(label);
    else set.add(label);
    onChange({ ...state, outputTypeLabels: [...set].sort() });
  };

  const toggleClass = (code: BlueprintClassCode) => {
    const set = new Set(state.classCodes);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    onChange({ ...state, classCodes: [...set] });
  };

  const toggleSize = (n: number) => {
    const set = new Set(state.sizes);
    if (set.has(n)) set.delete(n);
    else set.add(n);
    onChange({ ...state, sizes: [...set].sort((a, b) => a - b) });
  };

  const toggleGrade = (letter: string) => {
    const set = new Set(state.grades);
    const g = letter.toUpperCase();
    if (set.has(g)) set.delete(g);
    else set.add(g);
    onChange({ ...state, grades: [...set].sort() });
  };

  const toggleManufacturer = (code: string) => {
    const set = new Set(state.manufacturerCodes);
    const c = code.toUpperCase();
    if (set.has(c)) set.delete(c);
    else set.add(c);
    onChange({ ...state, manufacturerCodes: [...set].sort() });
  };

  const toggleIdToken = (token: string) => {
    const set = new Set(state.idTokens);
    if (set.has(token)) set.delete(token);
    else set.add(token);
    onChange({ ...state, idTokens: [...set] });
  };

  const toggleStarSystem = (name: string) => {
    const set = new Set(state.starSystems);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange({ ...state, starSystems: [...set].sort() });
  };

  const toggleJurisdiction = (name: string) => {
    const set = new Set(state.jurisdictions);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange({ ...state, jurisdictions: [...set].sort() });
  };

  const toggleContractor = (name: string) => {
    const set = new Set(state.contractors);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange({ ...state, contractors: [...set].sort() });
  };

  const toggleMissionType = (name: string) => {
    const set = new Set(state.missionTypes);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange({ ...state, missionTypes: [...set].sort() });
  };

  const panelProps = {
    state,
    onChange,
    facets,
    summaryFacets,
    wikiItemsFilters,
    resourceSelectOptions,
    toggleOutputType,
    toggleOutputTypeLabel,
    toggleClass,
    toggleSize,
    toggleGrade,
    toggleManufacturer,
    toggleIdToken,
    toggleStarSystem,
    toggleJurisdiction,
    toggleContractor,
    toggleMissionType,
    unlockIndexReady,
  };

  return (
    <>
      {!hideTrigger && (
        <div
          className="shrink-0 border-t border-primary/8 px-3 py-2"
          data-no-window-drag
        >
          {missionFilterTitle && (
            <ActiveFilterChip
              label={`Filtre mission : ${missionFilterTitle}`}
              onClear={() => onClearMissionFilter?.()}
            />
          )}
          {state.resourceUuid && (
            <ActiveFilterChip
              label={`Filtre ingrédient : ${state.resourceFilterLabel ?? state.resourceUuid}`}
              onClear={() =>
                onChange({
                  ...state,
                  resourceUuid: null,
                  resourceUuidAliases: [],
                  resourceFilterLabel: null,
                })
              }
            />
          )}
        </div>
      )}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        {!hideTrigger && (
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-full justify-between gap-2 border-primary/20 bg-primary/10 text-xs font-medium shadow-none",
                active > 0 && "border-primary/35",
              )}
              data-no-window-drag
            >
              <span className="flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">
                  Filtres avancés
                  {active > 0 && <span className="ml-1 text-primary">({active})</span>}
                </span>
              </span>
            </Button>
          </DialogTrigger>
        )}
        <DialogContent
          overlayClassName="z-[110]"
          className={cn(
            "z-[110] max-h-[min(88vh,44rem)] max-w-xl gap-0 border-primary/20 bg-popover/95 p-0 shadow-lg backdrop-blur-sm",
          )}
          data-no-window-drag
        >
          <DialogHeader className="border-b border-primary/10 px-4 py-3">
            <DialogTitle className="text-sm">Filtres avancés</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain p-4">
            <AdvancedFiltersBody {...panelProps} />
          </div>
          <DialogFooter className="border-t border-primary/10 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
