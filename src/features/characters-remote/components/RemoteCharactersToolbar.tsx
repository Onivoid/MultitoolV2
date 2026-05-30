import { Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import type { CharacterOrderType } from "@/features/characters-remote/charactersRemote.service";
import { cn } from "@/lib/utils";

interface RemoteCharactersToolbarProps {
  searchTerm: string;
  sort: CharacterOrderType;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: CharacterOrderType) => void;
}

const SORT_OPTIONS: {
  key: CharacterOrderType;
  label: string;
  icon: typeof Clock;
}[] = [
  { key: "latest", label: "Récents", icon: Clock },
  { key: "download", label: "Populaires", icon: Heart },
];

export function RemoteCharactersToolbar({
  searchTerm,
  sort,
  onSearchChange,
  onSortChange,
}: RemoteCharactersToolbarProps) {
  return (
    <section
      className="settings-section my-4 flex w-full shrink-0 flex-col gap-3 overflow-hidden p-3 md:flex-row md:items-center"
      data-no-window-drag
    >
      <div className="w-full md:max-w-lg md:flex-1">
        <FeatureSearchField
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Rechercher un personnage…"
        />
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant={sort === key ? "default" : "outline"}
            size="sm"
            data-no-window-drag
            className={cn(
              "h-10 gap-1.5 px-3 text-xs font-medium shadow-none sm:text-sm",
              sort !== key &&
                "border-primary/20 bg-primary/10 text-muted-foreground hover:bg-primary/15 hover:text-foreground",
            )}
            onClick={() => onSortChange(key)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
