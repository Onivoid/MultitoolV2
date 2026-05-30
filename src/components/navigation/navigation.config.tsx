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
  { path: "/ships3d", label: "Vaisseaux 3D" },
];

export const newsRoutes: NavRoute[] = [{ path: "/news", label: "News SC" }];

export const infoRoutes: NavRoute[] = [
  { path: "/patchnotes", label: "Patchnotes" },
  { path: "/updates", label: "Mises à jour" },
];

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
