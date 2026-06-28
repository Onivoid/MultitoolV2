import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Box,
  Cloud,
  Download,
  HardDrive,
  Languages,
  LayoutGrid,
  Newspaper,
  Package,
  Palette,
  Radio,
  Rocket,
  ScrollText,
  Users,
} from "lucide-react";
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
  icon?: LucideIcon;
  description?: string;
}

export interface NavRouteGroup {
  label: string;
  routes: NavRoute[];
}

export interface ExternalLink {
  href: string;
  label: string;
  icon: ReactNode;
  tooltip: string;
  group: "social" | "service";
}

export const featuresRouteGroups: NavRouteGroup[] = [
  {
    label: "Jeu",
    routes: [
      {
        path: "/traduction",
        label: "Traduction Française",
        icon: Languages,
        description: "Traductions SCEFRA",
      },
      {
        path: "/cache",
        label: "Cache",
        icon: HardDrive,
        description: "Dossiers cache du jeu",
      },
      {
        path: "/blueprints",
        label: "Blueprints",
        icon: Package,
        description: "Catalogue et journal Game.log",
      },
      {
        path: "/statistiques",
        label: "Statistiques",
        icon: BarChart3,
        description: "Stats extraites des logs",
      },
    ],
  },
  {
    label: "Personnages",
    routes: [
      {
        path: "/presets-local",
        label: "Persos locaux",
        icon: Users,
        description: "Personnages sur ce PC",
      },
      {
        path: "/presets-remote",
        label: "Persos en ligne",
        icon: Cloud,
        description: "SC Characters cloud",
      },
    ],
  },
  {
    label: "Outils",
    routes: [
      {
        path: "/vaisseaux",
        label: "Vaisseaux",
        icon: Rocket,
        description: "Comparateur et fiches vaisseaux",
      },
      {
        path: "/peintures",
        label: "Peintures",
        icon: Palette,
        description: "Encyclopédie des skins vaisseaux",
      },
      {
        path: "/hangar-exec",
        label: "Hangar Executive",
        icon: Radio,
        description: "Minuteurs PYAM et terminaux Pyro",
      },
      {
        path: "/ships3d",
        label: "Vaisseaux 3D",
        icon: Box,
        description: "Vue 3D des vaisseaux",
      },
    ],
  },
];

export const featuresRoutes: NavRoute[] = featuresRouteGroups.flatMap(
  (group) => group.routes,
);

export const featuresHubRoute: NavRoute = {
  path: "/fonctionnalites",
  label: "Fonctionnalités",
  icon: LayoutGrid,
  description: "Toutes les applications Multitool",
};

export const homeVisitEligibleRoutes: NavRoute[] = featuresRoutes;

export const HOME_VISIT_ELIGIBLE_PATHS: ReadonlySet<string> = new Set(
  homeVisitEligibleRoutes.map((r) => r.path),
);

export function isHomeVisitEligiblePath(pathname: string): boolean {
  return HOME_VISIT_ELIGIBLE_PATHS.has(pathname);
}

export const newsRoute: NavRoute = {
  path: "/news",
  label: "News SC",
  icon: Newspaper,
  description: "Actualités Star Citizen",
};

export const newsRoutes: NavRoute[] = [newsRoute];

export const infoRoutes: NavRoute[] = [
  {
    path: "/patchnotes",
    label: "Patchnotes Multitool",
    icon: ScrollText,
    description: "Notes de version Multitool",
  },
  {
    path: "/updates",
    label: "Mises à jour Multitool",
    icon: Download,
    description: "Historique des releases",
  },
];

export const allAppRoutes: NavRoute[] = [
  ...featuresRoutes,
  featuresHubRoute,
  ...newsRoutes,
  ...infoRoutes,
];

export const allDockRoutes: NavRoute[] = [
  ...featuresRoutes,
  ...newsRoutes,
  ...infoRoutes,
];

const routeTitleByPath: Record<string, string> = {
  ...Object.fromEntries(allDockRoutes.map((route) => [route.path, route.label])),
  [featuresHubRoute.path]: featuresHubRoute.label,
  "/settings": "Paramètres",
};

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
