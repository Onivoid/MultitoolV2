import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { DEFAULT_THEME_PREFERENCES, type ThemePreferences } from "@/types/theme-types";

export interface ThemeSelectedPayload {
  primary_color: string;
  synthesis_color2?: string;
  synthesis_speed?: number;
  synthesis_glow_intensity?: number;
  synthesis_distortion?: number;
  synthesis_complexity?: number;
  synthesis_flow_frequency?: number;
  synthesis_scale?: number;
  synthesis_contrast?: number;
  overlay_opacity?: number;
}

export function themePreferencesToPayload(
  prefs: ThemePreferences,
): ThemeSelectedPayload {
  return {
    primary_color: prefs.primaryColor,
    synthesis_color2: prefs.synthesisColor2,
    synthesis_speed: prefs.synthesisSpeed,
    synthesis_glow_intensity: prefs.synthesisGlowIntensity,
    synthesis_distortion: prefs.synthesisDistortion,
    synthesis_complexity: prefs.synthesisComplexity,
    synthesis_flow_frequency: prefs.synthesisFlowFrequency,
    synthesis_scale: prefs.synthesisScale,
    overlay_opacity: prefs.overlayOpacity,
    synthesis_contrast: prefs.synthesisContrast,
  };
}

export function payloadToThemePreferences(
  payload: ThemeSelectedPayload,
): ThemePreferences {
  const defaults = DEFAULT_THEME_PREFERENCES;
  return {
    primaryColor: payload.primary_color ?? defaults.primaryColor,
    synthesisColor2: payload.synthesis_color2 ?? defaults.synthesisColor2,
    synthesisSpeed: payload.synthesis_speed ?? defaults.synthesisSpeed,
    synthesisGlowIntensity:
      payload.synthesis_glow_intensity ?? defaults.synthesisGlowIntensity,
    synthesisDistortion:
      payload.synthesis_distortion ?? defaults.synthesisDistortion,
    synthesisComplexity:
      payload.synthesis_complexity ?? defaults.synthesisComplexity,
    synthesisFlowFrequency:
      payload.synthesis_flow_frequency ?? defaults.synthesisFlowFrequency,
    synthesisScale: payload.synthesis_scale ?? defaults.synthesisScale,
    overlayOpacity: payload.overlay_opacity ?? defaults.overlayOpacity,
    synthesisContrast:
      payload.synthesis_contrast ?? defaults.synthesisContrast,
  };
}

export const themeService = {
  save: (data: ThemeSelectedPayload) =>
    invokeCommand<void>(TAURI_COMMANDS.saveThemeSelected, { data }),

  load: () => invokeCommand<ThemeSelectedPayload>(TAURI_COMMANDS.loadThemeSelected),
};
