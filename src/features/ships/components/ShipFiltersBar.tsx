import { BlueprintFilterSelect } from "@/features/blueprints/components/BlueprintFilterSelect";
import {
  canonicalProductionStatus,
  formatProductionStatusFilterLabel,
  isWikiPlaceholder,
  mergeProductionStatusFilterValues,
} from "@/features/ships/ships.catalog.lib";
import type { VehicleSummary } from "@/features/ships/ships.types";

export interface ShipFacetFilters {
  manufacturer: string | null;
  sizeClass: number | null;
  role: string | null;
  productionStatus: string | null;
}

export const EMPTY_SHIP_FACETS: ShipFacetFilters = {
  manufacturer: null,
  sizeClass: null,
  role: null,
  productionStatus: null,
};

export function buildShipFacetOptions(ships: VehicleSummary[]) {
  const manufacturers = new Set<string>();
  const sizes = new Set<number>();
  const roles = new Set<string>();
  const statuses: string[] = [];

  for (const ship of ships) {
    if (ship.manufacturerName && !isWikiPlaceholder(ship.manufacturerName)) {
      manufacturers.add(ship.manufacturerName);
    }
    if (ship.sizeClass != null) sizes.add(ship.sizeClass);
    if (ship.role && !isWikiPlaceholder(ship.role)) roles.add(ship.role);
    if (ship.productionStatus) {
      statuses.push(ship.productionStatus);
    }
  }

  return {
    manufacturers: [...manufacturers].sort((a, b) => a.localeCompare(b, "fr")),
    sizes: [...sizes].sort((a, b) => a - b),
    roles: [...roles].sort((a, b) => a.localeCompare(b, "fr")),
    statuses: mergeProductionStatusFilterValues(statuses),
  };
}

export function shipMatchesFacets(
  ship: VehicleSummary,
  facets: ShipFacetFilters,
): boolean {
  if (facets.manufacturer && ship.manufacturerName !== facets.manufacturer) {
    return false;
  }
  if (facets.sizeClass != null && ship.sizeClass !== facets.sizeClass) {
    return false;
  }
  if (facets.role && ship.role !== facets.role) {
    return false;
  }
  if (facets.productionStatus) {
    const shipStatus = canonicalProductionStatus(ship.productionStatus);
    if (shipStatus !== facets.productionStatus) return false;
  }
  return true;
}

interface ShipFiltersBarProps {
  facets: ShipFacetFilters;
  onChange: (facets: ShipFacetFilters) => void;
  options: ReturnType<typeof buildShipFacetOptions>;
}

export function ShipFiltersBar({ facets, onChange, options }: ShipFiltersBarProps) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      data-no-window-drag
    >
      <FacetSelect
        label="Fabricant"
        value={facets.manufacturer ?? "__all__"}
        onChange={(v) =>
          onChange({ ...facets, manufacturer: v === "__all__" ? null : v })
        }
        options={[
          { value: "__all__", label: "Tous" },
          ...options.manufacturers.map((m) => ({ value: m, label: m })),
        ]}
      />
      <FacetSelect
        label="Taille"
        value={facets.sizeClass != null ? String(facets.sizeClass) : "__all__"}
        onChange={(v) =>
          onChange({
            ...facets,
            sizeClass: v === "__all__" ? null : Number(v),
          })
        }
        options={[
          { value: "__all__", label: "Toutes" },
          ...options.sizes.map((s) => ({ value: String(s), label: `T${s}` })),
        ]}
      />
      <FacetSelect
        label="Rôle"
        value={facets.role ?? "__all__"}
        onChange={(v) => onChange({ ...facets, role: v === "__all__" ? null : v })}
        options={[
          { value: "__all__", label: "Tous" },
          ...options.roles.map((r) => ({ value: r, label: r })),
        ]}
      />
      <FacetSelect
        label="Statut"
        value={facets.productionStatus ?? "__all__"}
        onChange={(v) =>
          onChange({
            ...facets,
            productionStatus: v === "__all__" ? null : v,
          })
        }
        options={[
          { value: "__all__", label: "Tous" },
          ...options.statuses.map((status) => ({
            value: status,
            label: formatProductionStatusFilterLabel(status),
          })),
        ]}
      />
    </div>
  );
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <BlueprintFilterSelect
        value={value}
        onValueChange={onChange}
        options={options}
        className="w-full max-w-none"
      />
    </div>
  );
}
