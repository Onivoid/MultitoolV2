import { cn } from "@/lib/utils";

export const FEATURE_CARD_WIDTH_CLASS = "w-[288px]";

export function getFeatureCardsLayoutClass(): string {
  return cn(
    "mx-auto flex w-full max-w-4xl flex-wrap content-start items-start justify-center gap-3",
  );
}
