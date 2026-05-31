import { homeVisitEligibleRoutes } from "@/components/navigation/navigation.config";

const labelByPath = Object.fromEntries(
  homeVisitEligibleRoutes.map((r) => [r.path, r.label]),
);

export function getHomeRouteLabel(path: string): string {
  return labelByPath[path] ?? path;
}
