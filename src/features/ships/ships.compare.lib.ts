/** Indices des cellules « meilleures » — rien si toutes les valeurs sont égales. */
export function compareBestIndices(
  values: (number | null | undefined)[],
  options?: { lowerIsBetter?: boolean },
): Set<number> {
  const numeric = values.map((value) =>
    value != null && Number.isFinite(value) ? value : null,
  );
  const valid = numeric.filter((value): value is number => value !== null);
  if (valid.length < 2) return new Set();

  const unique = new Set(valid);
  if (unique.size === 1) return new Set();

  const target = options?.lowerIsBetter ? Math.min(...valid) : Math.max(...valid);
  const indices = new Set<number>();
  numeric.forEach((value, index) => {
    if (value === target) indices.add(index);
  });
  return indices;
}
