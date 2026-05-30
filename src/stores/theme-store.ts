import { create } from "zustand";
import {
  DEFAULT_THEME_PREFERENCES,
  type ThemePreferences,
  type ThemeStore,
} from "@/types/theme-types";

export const useThemeStore = create<ThemeStore>((set) => ({
  ...DEFAULT_THEME_PREFERENCES,
  primaryColorChoices: [
    "#6463b6",
    "#3B3B98",
    "#B33771",
    "#FC427B",
    "#FEA47B",
  ],
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setSynthesisColor2: (synthesisColor2) => set({ synthesisColor2 }),
  setThemePreference: (key, value) => set({ [key]: value }),
  setThemePreferences: (prefs) =>
    set((state) => ({ ...state, ...prefs })),
}));

export function getThemePreferencesFromStore(): ThemePreferences {
  const state = useThemeStore.getState();
  return {
    primaryColor: state.primaryColor,
    synthesisColor2: state.synthesisColor2,
    synthesisSpeed: state.synthesisSpeed,
    synthesisGlowIntensity: state.synthesisGlowIntensity,
    synthesisDistortion: state.synthesisDistortion,
    synthesisComplexity: state.synthesisComplexity,
    synthesisFlowFrequency: state.synthesisFlowFrequency,
    synthesisScale: state.synthesisScale,
    synthesisContrast: state.synthesisContrast,
    overlayOpacity: state.overlayOpacity,
  };
}
