export interface ThemePreferences {
  primaryColor: string;
  synthesisColor2: string;
  synthesisSpeed: number;
  synthesisGlowIntensity: number;
  synthesisDistortion: number;
  synthesisComplexity: number;
  synthesisFlowFrequency: number;
  synthesisScale: number;
  synthesisContrast: number;
  overlayOpacity: number;
}

export interface ThemeStore extends ThemePreferences {
  primaryColorChoices: string[];
  setPrimaryColor: (color: string) => void;
  setSynthesisColor2: (color: string) => void;
  setThemePreference: <K extends keyof ThemePreferences>(
    key: K,
    value: ThemePreferences[K],
  ) => void;
  setThemePreferences: (prefs: Partial<ThemePreferences>) => void;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  primaryColor: "#6463b6",
  synthesisColor2: "#633189",
  synthesisSpeed: 0.35,
  synthesisGlowIntensity: 0.4,
  synthesisDistortion: 0.7,
  synthesisComplexity: 7,
  synthesisFlowFrequency: 5.9,
  synthesisScale: 1.2,
  synthesisContrast: 1.25,
  overlayOpacity: 0.48,
};
