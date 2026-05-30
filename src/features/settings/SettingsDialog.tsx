import { Power, PowerOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/custom/color-picker";
import { useSettings } from "@/features/settings/useSettings";

export function SettingsDialog() {
  const vm = useSettings();

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Apparence</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="color-picker">Couleur du thème</Label>
          <ColorPicker />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Démarrage automatique</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-startup">Lancer au démarrage de Windows</Label>
            <p className="text-sm text-muted-foreground">
              L'application se lancera minimisée dans la barre système
            </p>
          </div>
          <Switch
            id="auto-startup"
            checked={vm.autoStartupEnabled}
            onCheckedChange={vm.handleAutoStartupToggle}
            disabled={vm.loading || vm.checkingAutoStartup}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Surveillance Game.log</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="gamelog-auto-start">Démarrer automatiquement</Label>
            <p className="text-sm text-muted-foreground">
              Surveille le Game.log LIVE dès le lancement de Multitool
            </p>
          </div>
          <Switch
            id="gamelog-auto-start"
            checked={vm.gamelogConfig.autoStart}
            onCheckedChange={vm.handleGamelogAutoStartToggle}
            disabled={vm.loading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Démarrez ou arrêtez la capture manuellement depuis la page Blueprints.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mises à jour automatiques</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="background-service">Service de fond</Label>
            <p className="text-sm text-muted-foreground">
              Vérifie périodiquement les mises à jour de traduction
            </p>
          </div>
          <div className="flex items-center gap-2">
            {vm.serviceRunning && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Power className="w-4 h-4" />
                Actif
              </span>
            )}
            {!vm.serviceRunning && vm.config.enabled && (
              <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Démarrage...
              </span>
            )}
            {!vm.serviceRunning && !vm.config.enabled && (
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <PowerOff className="w-4 h-4" />
                Inactif
              </span>
            )}
            <Switch
              id="background-service"
              checked={vm.config.enabled}
              onCheckedChange={vm.handleServiceToggle}
              disabled={vm.loading}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="check-interval">Intervalle de vérification (minutes)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="check-interval"
              type="number"
              min="5"
              max="1440"
              value={vm.config.check_interval_minutes}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  vm.setConfig({ ...vm.config, check_interval_minutes: value });
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 5) {
                  vm.handleIntervalChange(value);
                }
              }}
              className="w-32"
              disabled={vm.loading}
            />
            <span className="text-sm text-muted-foreground">
              Vérification toutes les {vm.config.check_interval_minutes} minute(s)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum: 5 minutes • Recommandé: 5-10 minutes
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Comment ça fonctionne ?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Le service vérifie périodiquement les mises à jour de traduction sur GitHub</li>
            <li>Si une mise à jour est disponible, elle est automatiquement installée</li>
            <li>Seules les versions du jeu avec traduction installée sont mises à jour</li>
            <li>Le service fonctionne en arrière-plan sans ralentir votre système</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
