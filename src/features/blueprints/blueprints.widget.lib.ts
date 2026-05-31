export const BLUEPRINT_WIDGET_LIST_LIMIT = 8;

export function formatBlueprintDateShort(ts: number): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts * 1000));
  } catch {
    return "";
  }
}

export function truncateProductName(name: string, max = 36): string {
  if (name.length <= max) {
    return name;
  }
  return `${name.slice(0, max - 1)}…`;
}
