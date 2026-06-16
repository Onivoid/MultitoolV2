import { cn } from "@/lib/utils";

const SYSTEM_COLORS: Record<string, string> = {
  Pyro: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  Stanton: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  Nyx: "border-violet-500/35 bg-violet-500/10 text-violet-300",
};

const DEFAULT_SYSTEM_CLASS =
  "border-muted-foreground/25 bg-muted/20 text-muted-foreground";

export function systemBadgeClass(system: string): string {
  return SYSTEM_COLORS[system.trim()] ?? DEFAULT_SYSTEM_CLASS;
}

export const CLASS_BADGE_CLASS: Record<string, string> = {
  mili: "border-red-500/35 bg-red-500/10 text-red-300",
  civi: "border-sky-500/25 bg-sky-500/8 text-sky-200",
  indu: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  stlh: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  comp: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
};

export function classBadgeClass(code: string | null | undefined): string | null {
  if (!code) return null;
  return CLASS_BADGE_CLASS[code] ?? null;
}

export function legalityBadgeClass(lawful: boolean | null | undefined): string {
  if (lawful === true) {
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  }
  if (lawful === false) {
    return "border-red-500/35 bg-red-500/10 text-red-300";
  }
  return "border-muted-foreground/25 bg-muted/20 text-muted-foreground";
}

export function legalityLabel(
  lawful: boolean | null | undefined,
  illegal?: boolean | null,
): string {
  if (typeof lawful === "boolean") return lawful ? "Légal" : "Illégal";
  if (typeof illegal === "boolean") return illegal ? "Illégal" : "Légal";
  return "—";
}

export function mergeBadgeClasses(base: string, extra?: string | null): string {
  return cn(base, extra);
}
