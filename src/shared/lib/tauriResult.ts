/** Normalise une réponse Tauri souvent sérialisée en JSON string. */
export function parseJsonResponse<T>(raw: unknown): T {
  if (typeof raw === "string") {
    return JSON.parse(raw) as T;
  }
  return raw as T;
}
