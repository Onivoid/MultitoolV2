import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingRow } from "@/shared/components/v3/SettingRow";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { cn } from "@/lib/utils";

interface OnboardingState {
  onboardingDone: boolean;
  attempts: number;
  wasCompleted: boolean;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Bienvenue dans Multitool" },
  { id: "detect", title: "Star Citizen" },
  { id: "services", title: "Services" },
  { id: "finish", title: "C'est parti" },
] as const;

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [gamelogAuto, setGamelogAuto] = useState(false);
  const [bgService, setBgService] = useState(false);
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    void (async () => {
      const s = await invokeCommand<OnboardingState>(
        TAURI_COMMANDS.recordOnboardingAttempt,
      );
      setState(s);
      try {
        const versions = await invokeCommand<{
          versions: Record<string, { path: string }>;
        }>(TAURI_COMMANDS.getStarCitizenVersions);
        setChannels(Object.keys(versions.versions ?? {}).sort());
      } catch {
        setChannels([]);
      }
    })();
  }, []);

  const canSkip = (state?.wasCompleted ?? false) || (state?.attempts ?? 0) > 1;
  const isLast = step >= STEPS.length - 1;

  const finish = async () => {
    await invokeCommand(TAURI_COMMANDS.completeOnboarding);
    onComplete();
  };

  const handleNext = async () => {
    if (isLast) {
      await finish();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSkip = async () => {
    await invokeCommand(TAURI_COMMANDS.completeOnboarding);
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-background/90 p-6 backdrop-blur-md"
      data-no-window-drag
    >
      <div className="settings-section w-full max-w-lg p-6 shadow-xl">
        <p className="text-ui-caption mb-1 text-muted-foreground">
          Étape {step + 1} / {STEPS.length}
        </p>
        <h2 className="text-lg font-semibold">{STEPS[step].title}</h2>

        <div className="mt-4 min-h-[10rem] space-y-3 text-ui-secondary">
          {step === 0 && (
            <p className="leading-relaxed text-muted-foreground">
              Multitool regroupe traduction, blueprints, statistiques et outils
              communautaires pour Star Citizen. Cette introduction configure les
              bases en quelques étapes.
            </p>
          )}
          {step === 1 && (
            <>
              {channels.length > 0 ? (
                <ul className="space-y-1">
                  {channels.map((ch) => (
                    <li key={ch} className="rounded-md border border-primary/15 px-3 py-2">
                      Canal <strong>{ch}</strong> détecté
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  Aucune installation détectée. Lancez le RSI Launcher puis relancez
                  Multitool.
                </p>
              )}
            </>
          )}
          {step === 2 && (
            <div className="space-y-1">
              <SettingRow
                title="Surveillance Game.log"
                description="Détecte les blueprints automatiquement"
                htmlFor="onb-gamelog"
              >
                <Switch
                  id="onb-gamelog"
                  checked={gamelogAuto}
                  onCheckedChange={setGamelogAuto}
                />
              </SettingRow>
              <SettingRow
                title="Service de traduction"
                description="Tâche en arrière-plan"
                htmlFor="onb-bg"
              >
                <Switch id="onb-bg" checked={bgService} onCheckedChange={setBgService} />
              </SettingRow>
              <SettingRow
                title="Démarrage automatique"
                description="Lancer Multitool avec Windows"
                htmlFor="onb-auto"
              >
                <Switch id="onb-auto" checked={autostart} onCheckedChange={setAutostart} />
              </SettingRow>
              <p className="text-ui-caption pt-2 text-muted-foreground">
                Vous pourrez affiner ces réglages dans{" "}
                <Link to="/settings" className="text-primary hover:underline">
                  Paramètres
                </Link>
                .
              </p>
            </div>
          )}
          {step === 3 && (
            <p className="leading-relaxed text-muted-foreground">
              Personnalisez votre accueil via le bouton « Personnaliser » : widgets
              News, statut RSI, versions SC, schémas, etc.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {canSkip ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void handleSkip()}>
              Passer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Retour
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => void handleNext()}>
              {isLast ? "C'est parti" : "Suivant"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i === step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
