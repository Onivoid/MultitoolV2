import { invoke } from "@tauri-apps/api/core";
import { useThemeStore } from "@/stores/theme-store";
import logger from "@/utils/logger";

// Fonction pour convertir une couleur hexadécimale en HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Retirer le '#' si présent
    hex = hex.replace("#", "");

    // Convertir en valeurs RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Trouver les valeurs min et max de RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    const l: number = (max + min) / 2;

    if (max === min) {
        h = 0; // Achromatique
    } else {
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

    s = s * 100;
    h = Math.round(h);
    s = Math.round(s * 10) / 10; // Arrondi à 0.1 près
    const lRounded = Math.round(l * 1000) / 10; // Arrondi à 0.1 près

    return { h, s, l: lRounded };
}

// Fonction pour formater HSL en chaîne
function formatHSL(hsl: { h: number; s: number; l: number }): string {
    const { h, s, l } = hsl;
    return `${h} ${s}% ${l}%`;
}

// Fonction pour générer le thème Shadcn
function generateShadcnTheme(primaryColor: string): string {
    // Convertir la couleur primaire en HSL
    const primaryHSL = hexToHSL(primaryColor);

    // Définir les variables en fonction de la couleur primaire
    const primaryForeground = { h: 0, s: 0, l: 100 }; // Blanc

    // Calculer les autres variables
    //const background = { h: primaryHSL.h, s: 100, l: 95 };
    const foreground = { h: primaryHSL.h, s: 5, l: 0 };
    const card = { h: primaryHSL.h, s: 50, l: 90 };
    const cardForeground = { h: primaryHSL.h, s: 5, l: 10 };
    const popover = { h: primaryHSL.h, s: 100, l: 95 };
    const popoverForeground = { h: primaryHSL.h, s: 100, l: 0 };

    const secondary = { h: primaryHSL.h, s: 30, l: 70 };
    const secondaryForeground = { h: 0, s: 0, l: 0 }; // Noir

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

    // Générer le thème CSS
    const theme = `
  :root  {
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
  }
  .dark  {
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
}
`;
    return theme;
}

// Fonction exportée pour appliquer le thème au HTML
export function applyTheme(primaryColor: string): void {
    const themeCSS = generateShadcnTheme(primaryColor);

    // Créer ou réutiliser un élément <style> avec un ID spécifique
    let styleElement = document.getElementById(
        "shadcn-theme"
    ) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "shadcn-theme";
        document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = themeCSS;

    invoke("save_theme_selected", { data: { primary_color: primaryColor } })
        .then(() => logger.log("Thème enregistré avec succès"))
        .catch((error) =>
            logger.error("Erreur lors de l'enregistrement du thème", error)
        );
}

export function loadAndApplyTheme(): void {
    const { setPrimaryColor } = useThemeStore.getState();
    invoke("load_theme_selected")
        .then((value) => {
            const theme = value as { primary_color: string };
            setPrimaryColor(theme.primary_color);
            applyTheme(theme.primary_color);
        })
        .catch((error) =>
            logger.error("Erreur lors du chargement du thème", error)
        );
}
