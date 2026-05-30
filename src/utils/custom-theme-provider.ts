import { useThemeStore } from "@/stores/theme-store";
import {
  payloadToThemePreferences,
  themePreferencesToPayload,
  themeService,
} from "@/features/theme/theme.service";
import type { ThemePreferences } from "@/types/theme-types";
import logger from "@/utils/logger";

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }

  return { h, s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function formatHSL(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

export function deriveSynthesisColor1(primaryColor: string): string {
  const { h, s } = hexToHSL(primaryColor);
  return hslToHex(h, Math.max(s * 0.45, 30), 7);
}

function generateShadcnTheme(prefs: ThemePreferences): string {
  const primaryHSL = hexToHSL(prefs.primaryColor);
  const primaryForeground = { h: 0, s: 0, l: 100 };
  const foreground = { h: primaryHSL.h, s: 5, l: 0 };
  const card = { h: primaryHSL.h, s: 50, l: 90 };
  const cardForeground = { h: primaryHSL.h, s: 5, l: 10 };
  const popover = { h: primaryHSL.h, s: 100, l: 95 };
  const popoverForeground = { h: primaryHSL.h, s: 100, l: 0 };
  const secondary = { h: primaryHSL.h, s: 30, l: 70 };
  const secondaryForeground = { h: 0, s: 0, l: 0 };
  const mutedHue = (primaryHSL.h - 38 + 360) % 360;
  const muted = { h: mutedHue, s: 30, l: 85 };
  const mutedForeground = { h: primaryHSL.h, s: 5, l: 35 };
  const accent = { h: mutedHue, s: 30, l: 80 };
  const accentForeground = { h: primaryHSL.h, s: 5, l: 10 };
  const destructive = { h: 0, s: 100, l: 30 };
  const destructiveForeground = { h: primaryHSL.h, s: 5, l: 90 };
  const border = { h: primaryHSL.h, s: 30, l: 50 };
  const input = { h: primaryHSL.h, s: 30, l: 18 };
  const ring = primaryHSL;
  const radius = "0.5rem";
  const overlayOpacity = prefs.overlayOpacity;

  return `
  :root {
    --foreground: ${formatHSL(foreground)};
    --card: ${formatHSL(card)};
    --card-foreground: ${formatHSL(cardForeground)};
    --popover: ${formatHSL(popover)};
    --popover-foreground: ${formatHSL(popoverForeground)};
    --primary: ${formatHSL(primaryHSL)};
    --primary-foreground: ${formatHSL(primaryForeground)};
    --secondary: ${formatHSL(secondary)};
    --secondary-foreground: ${formatHSL(secondaryForeground)};
    --muted: ${formatHSL(muted)};
    --muted-foreground: ${formatHSL(mutedForeground)};
    --accent: ${formatHSL(accent)};
    --accent-foreground: ${formatHSL(accentForeground)};
    --destructive: ${formatHSL(destructive)};
    --destructive-foreground: ${formatHSL(destructiveForeground)};
    --border: ${formatHSL(border)};
    --input: ${formatHSL(input)};
    --ring: ${formatHSL(ring)};
    --radius: ${radius};
    --app-overlay-opacity: ${overlayOpacity};
  }
  .dark {
    --foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 90 })};
    --card: ${formatHSL({ h: primaryHSL.h, s: 50, l: 1 })};
    --card-foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 90 })};
    --popover: ${formatHSL({ h: primaryHSL.h, s: 50, l: 5 })};
    --popover-foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 90 })};
    --primary: ${formatHSL(primaryHSL)};
    --primary-foreground: ${formatHSL(primaryForeground)};
    --secondary: ${formatHSL({ h: primaryHSL.h, s: 30, l: 10 })};
    --secondary-foreground: ${formatHSL({ h: 0, s: 0, l: 100 })};
    --muted: ${formatHSL({ h: mutedHue, s: 30, l: 15 })};
    --muted-foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 60 })};
    --accent: ${formatHSL({ h: mutedHue, s: 30, l: 15 })};
    --accent-foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 90 })};
    --destructive: ${formatHSL(destructive)};
    --destructive-foreground: ${formatHSL({ h: primaryHSL.h, s: 5, l: 90 })};
    --border: ${formatHSL({ h: primaryHSL.h, s: 30, l: 18 })};
    --input: ${formatHSL({ h: primaryHSL.h, s: 30, l: 18 })};
    --ring: ${formatHSL(ring)};
    --radius: ${radius};
    --app-overlay-opacity: ${overlayOpacity};
  }`;
}

export function applyThemePreferences(prefs: ThemePreferences, persist = true): void {
  const themeCSS = generateShadcnTheme(prefs);
  let styleElement = document.getElementById("shadcn-theme") as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "shadcn-theme";
    document.head.appendChild(styleElement);
  }

  styleElement.innerHTML = themeCSS;

  if (!persist) return;

  themeService
    .save(themePreferencesToPayload(prefs))
    .then(() => logger.log("Thème enregistré avec succès"))
    .catch((error) => logger.error("Erreur lors de l'enregistrement du thème", error));
}

export function loadAndApplyTheme(): void {
  const { setThemePreferences } = useThemeStore.getState();
  themeService
    .load()
    .then((value) => {
      const prefs = payloadToThemePreferences(value);
      setThemePreferences(prefs);
      applyThemePreferences(prefs, false);
    })
    .catch((error) => logger.error("Erreur lors du chargement du thème", error));
}
