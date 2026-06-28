import { useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface MediaLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt?: string;
  title?: string;
  description?: string;
}

export function MediaLightbox({
  open,
  onOpenChange,
  src,
  alt = "Image",
  title,
  description,
}: MediaLightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92vh] max-w-[min(96vw,1100px)] gap-3 border-primary/20 bg-background/95 p-3",
          "flex flex-col",
        )}
        data-no-window-drag
      >
        {title ? (
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        ) : (
          <DialogTitle className="sr-only">{alt}</DialogTitle>
        )}
        {description ? (
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        ) : null}
        {src ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg border border-primary/10 bg-black/20 p-2">
            <img
              src={src}
              alt={alt}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
