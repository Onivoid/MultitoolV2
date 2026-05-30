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
  synthesisColor2: "#3b0764",
  synthesisSpeed: 0.5,
  synthesisGlowIntensity: 0.42,
  synthesisDistortion: 0.65,
  synthesisComplexity: 6,
  synthesisFlowFrequency: 3.2,
  synthesisScale: 1,
  synthesisContrast: 1.1,
  overlayOpacity: 0.2,
};
