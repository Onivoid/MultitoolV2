import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { ColorPicker } from "@/components/custom/color-picker";
import { SettingRow } from "@/shared/components/v3/SettingRow";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getThemePreferencesFromStore, useThemeStore } from "@/stores/theme-store";
import { applyThemePreferences } from "@/utils/custom-theme-provider";
import { DEFAULT_THEME_PREFERENCES, type ThemePreferences } from "@/types/theme-types";
import { cn } from "@/lib/utils";

function ThemeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const display = format ? format(value) : String(value);

  return (
    <div className="space-y-2 py-2.5" data-no-window-drag>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        data-no-window-drag
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/20",
          "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
        )}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function updatePreferences(patch: Partial<ThemePreferences>) {
  const next = { ...getThemePreferencesFromStore(), ...patch };
  useThemeStore.getState().setThemePreferences(next);
  applyThemePreferences(next);
}

function restoreDefaultTheme() {
  updatePreferences(DEFAULT_THEME_PREFERENCES);
}

export function ThemeAppearanceSettings() {
  const prefs = useThemeStore();
  const [backgroundOpen, setBackgroundOpen] = useState(false);

  return (
    <div className="divide-y divide-primary/8" data-no-window-drag>
      <SettingRow title="Couleur d'accent" htmlFor="theme-primary">
        <ColorPicker
          className="w-[220px]"
          value={prefs.primaryColor}
          onChange={(color) => updatePreferences({ primaryColor: color })}
        />
      </SettingRow>

      <SettingRow
        title="Couleur secondaire du fond"
        description="Deuxième teinte de l'animation Synthesis"
        htmlFor="theme-synthesis-color2"
      >
        <ColorPicker
          className="w-[220px]"
          value={prefs.synthesisColor2}
          label="Couleur secondaire"
          onChange={(color) => updatePreferences({ synthesisColor2: color })}
        />
      </SettingRow>

      <div className="py-2">
        <Button
          type="button"
          variant="ghost"
          data-no-window-drag
          className="h-auto w-full justify-between px-0 py-2 font-medium hover:bg-transparent"
          onClick={() => setBackgroundOpen((open) => !open)}
        >
          <span className="text-sm">Paramètres du fond animé</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              backgroundOpen && "rotate-180",
            )}
          />
        </Button>

        {backgroundOpen && (
          <div className="divide-y divide-primary/8 border-t border-primary/8">
            <ThemeSlider
              id="theme-overlay-opacity"
              label="Opacité du voile"
              min={0}
              max={0.6}
              step={0.02}
              value={prefs.overlayOpacity}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(overlayOpacity) => updatePreferences({ overlayOpacity })}
            />

            <ThemeSlider
              id="theme-synthesis-speed"
              label="Vitesse de l'animation"
              min={0.05}
              max={1.2}
              step={0.05}
              value={prefs.synthesisSpeed}
              format={(v) => v.toFixed(2)}
              onChange={(synthesisSpeed) => updatePreferences({ synthesisSpeed })}
            />

            <ThemeSlider
              id="theme-synthesis-glow"
              label="Intensité lumineuse"
              min={0}
              max={1}
              step={0.02}
              value={prefs.synthesisGlowIntensity}
              format={(v) => v.toFixed(2)}
              onChange={(synthesisGlowIntensity) =>
                updatePreferences({ synthesisGlowIntensity })
              }
            />

            <ThemeSlider
              id="theme-synthesis-distortion"
              label="Distorsion"
              min={0.1}
              max={1.2}
              step={0.05}
              value={prefs.synthesisDistortion}
              format={(v) => v.toFixed(2)}
              onChange={(synthesisDistortion) =>
                updatePreferences({ synthesisDistortion })
              }
            />

            <ThemeSlider
              id="theme-synthesis-complexity"
              label="Complexité"
              min={2}
              max={12}
              step={1}
              value={prefs.synthesisComplexity}
              onChange={(synthesisComplexity) =>
                updatePreferences({ synthesisComplexity })
              }
            />

            <ThemeSlider
              id="theme-synthesis-flow"
              label="Fréquence des vagues"
              min={0.5}
              max={6}
              step={0.1}
              value={prefs.synthesisFlowFrequency}
              format={(v) => v.toFixed(1)}
              onChange={(synthesisFlowFrequency) =>
                updatePreferences({ synthesisFlowFrequency })
              }
            />

            <ThemeSlider
              id="theme-synthesis-scale"
              label="Zoom"
              min={0.5}
              max={2.5}
              step={0.1}
              value={prefs.synthesisScale}
              format={(v) => v.toFixed(1)}
              onChange={(synthesisScale) => updatePreferences({ synthesisScale })}
            />

            <ThemeSlider
              id="theme-synthesis-contrast"
              label="Contraste"
              min={0.6}
              max={1.8}
              step={0.05}
              value={prefs.synthesisContrast}
              format={(v) => v.toFixed(2)}
              onChange={(synthesisContrast) => updatePreferences({ synthesisContrast })}
            />
          </div>
        )}
      </div>

      <div className="py-3">
        <Button
          type="button"
          variant="outline"
          data-no-window-drag
          className="w-full gap-2"
          onClick={restoreDefaultTheme}
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          Restaurer le thème par défaut
        </Button>
      </div>
    </div>
  );
}
