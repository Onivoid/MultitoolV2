import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeatureSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}

export function FeatureSearchField({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: FeatureSearchFieldProps) {
  return (
    <div
      className={cn(
        "group flex h-10 w-full items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 transition-[border-color,background-color,box-shadow]",
        "focus-within:border-primary/35 focus-within:bg-primary/14 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]",
        className,
      )}
      data-no-window-drag
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/15"
        aria-hidden
      >
        <Search className="h-4 w-4 text-primary" />
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none",
          inputClassName,
        )}
        data-no-window-drag
      />

      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-sm text-muted-foreground hover:bg-primary/15 hover:text-foreground"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          data-no-window-drag
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
