import type { ReactNode } from "react";
import {
  IconBrandDiscord,
  IconBrandGithub,
  IconBrandTwitch,
  IconBrandYoutube,
  IconCloud,
} from "@tabler/icons-react";

export interface NavRoute {
  path: string;
  label: string;
}

export interface ExternalLink {
  href: string;
  label: string;
  icon: ReactNode;
  tooltip: string;
  group: "social" | "service";
}

export const featuresRoutes: NavRoute[] = [
  { path: "/traduction", label: "Traduction" },
  { path: "/cache", label: "Cache" },
  { path: "/presets-local", label: "Persos locaux" },
  { path: "/presets-remote", label: "Persos en ligne" },
  { path: "/blueprints", label: "Blueprints" },
  { path: "/statistiques", label: "Statistiques" },
  { path: "/ships3d", label: "Vaisseaux 3D" },
];

/** Routes comptabilisées pour les raccourcis accueil (features uniquement). */
export const homeVisitEligibleRoutes: NavRoute[] = featuresRoutes;

export const HOME_VISIT_ELIGIBLE_PATHS: ReadonlySet<string> = new Set(
  homeVisitEligibleRoutes.map((r) => r.path),
);

export function isHomeVisitEligiblePath(pathname: string): boolean {
  return HOME_VISIT_ELIGIBLE_PATHS.has(pathname);
}

export const newsRoutes: NavRoute[] = [{ path: "/news", label: "News SC" }];

export const infoRoutes: NavRoute[] = [
  { path: "/patchnotes", label: "Patchnotes" },
  { path: "/updates", label: "Mises à jour" },
];

/** Toutes les routes du dock (Features, News, Informations). */
export const allDockRoutes: NavRoute[] = [
  ...featuresRoutes,
  ...newsRoutes,
  ...infoRoutes,
];

const routeTitleByPath: Record<string, string> = {
  ...Object.fromEntries(allDockRoutes.map((route) => [route.path, route.label])),
  "/settings": "Paramètres",
};

/** Libellé affiché en barre de titre (aligné sur le dock). */
export function getRouteTitle(pathname: string): string | null {
  if (pathname === "/") return null;
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return null;
  return routeTitleByPath[`/${segment}`] ?? null;
}

export const externalLinks: ExternalLink[] = [
  {
    href: "https://www.youtube.com/@onivoid",
    icon: <IconBrandYoutube size={20} />,
    label: "Youtube",
    tooltip: "Youtube",
    group: "social",
  },
  {
    href: "https://discord.com/invite/aUEEdMdS6j",
    icon: <IconBrandDiscord size={20} />,
    label: "Discord",
    tooltip: "Discord",
    group: "social",
  },
  {
    href: "https://www.twitch.tv/onivoid_",
    icon: <IconBrandTwitch size={20} />,
    label: "Twitch",
    tooltip: "Twitch",
    group: "social",
  },
  {
    href: "https://github.com/Onivoid",
    icon: <IconBrandGithub size={20} />,
    label: "Github",
    tooltip: "Github",
    group: "social",
  },
  {
    href: "https://discord.com/invite/DccQN8BN2V",
    icon: <IconBrandDiscord size={20} />,
    label: "SCEFRA",
    tooltip: "SCEFRA (Traduction)",
    group: "service",
  },
  {
    href: "https://www.star-citizen-characters.com/",
    icon: <IconCloud size={20} />,
    label: "SC Characters",
    tooltip: "SC Characters (Presets)",
    group: "service",
  },
];
