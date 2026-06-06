import { Loader2, Power, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GameConfigBackupSection } from "@/features/settings/components/GameConfigBackupSection";
import { OnboardingResetSection } from "@/features/settings/components/OnboardingResetSection";
import { ThemeAppearanceSettings } from "@/features/settings/components/ThemeAppearanceSettings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_SCROLL } from "@/shared/components/pageStyles";
import { SettingRow } from "@/shared/components/v3/SettingRow";
import { useSettings } from "@/features/settings/useSettings";
import {
  externalLinks,
  type ExternalLink,
} from "@/components/navigation/navigation.config";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function SettingsSection({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("settings-section flex flex-col overflow-hidden", className)}
    >
      <header className="settings-section-header px-4 py-2.5 pl-3.5">
        <h2 className="text-sm font-semibold leading-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      <div className="divide-y divide-primary/8 px-4">{children}</div>
      {footer && (
        <footer className="settings-section-footer px-4 py-2 text-xs leading-relaxed text-muted-foreground">
          {footer}
        </footer>
      )}
    </section>
  );
}

function ExternalLinkBlock({ link }: { link: ExternalLink }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="settings-link-block flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-md px-2 py-2"
          onClick={() => openExternalUrl(link.href)}
        >
          <span className="text-foreground/90 [&>svg]:h-5 [&>svg]:w-5">
            {link.icon}
          </span>
          <span className="text-ui-caption max-w-full truncate leading-tight text-muted-foreground">
            {link.label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{link.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ExternalLinksPanel({
  title,
  description,
  links,
  columns,
}: {
  title: string;
  description: string;
  links: ExternalLink[];
  columns: 2 | 4;
}) {
  return (
    <SettingsSection title={title} description={description}>
      <div
        className={cn(
          "grid gap-2 py-3",
          columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
        )}
      >
        {links.map((link) => (
          <ExternalLinkBlock key={link.href} link={link} />
        ))}
      </div>
    </SettingsSection>
  );
}

function ServiceStatus({
  running,
  enabled,
  loading,
}: {
  running: boolean;
  enabled: boolean;
  loading: boolean;
}) {
  if (running) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-500/30 bg-green-500/10 text-green-400"
      >
        <Power className="h-3 w-3" />
        Actif
      </Badge>
    );
  }
  if (enabled && loading) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Démarrage
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <PowerOff className="h-3 w-3" />
      Inactif
    </Badge>
  );
}

export default function SettingsPage() {
  const vm = useSettings();
  const socialLinks = externalLinks.filter((link) => link.group === "social");
  const serviceLinks = externalLinks.filter((link) => link.group === "service");

  return (
    <PageMotion className="px-5 pt-2 sm:px-6">
      <div className={PAGE_SCROLL}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-4">
            <SettingsSection
              title="Apparence"
              description="Thème, fond animé et voile de l'interface"
            >
              <ThemeAppearanceSettings />
            </SettingsSection>

            <SettingsSection
              title="Export sauvegarde Star Citizen"
              description="Backup ponctuel : profil, contrôles, personnages, presets et logs optionnels (ZIP)"
              footer="L'export est manuel — aucune sauvegarde automatique."
            >
              <GameConfigBackupSection />
            </SettingsSection>

            <SettingsSection
              title="Surveillance Game.log"
              description="Blueprints détectés automatiquement"
              footer="Contrôle manuel depuis la page Blueprints."
            >
              <SettingRow
                title="Démarrer automatiquement"
                description="Surveille le Game.log LIVE au lancement"
                htmlFor="gamelog-auto-start"
              >
                <Switch
                  id="gamelog-auto-start"
                  checked={vm.gamelogConfig.autoStart}
                  onCheckedChange={vm.handleGamelogAutoStartToggle}
                  disabled={vm.loading}
                />
              </SettingRow>
            </SettingsSection>

            <ExternalLinksPanel
              title="Communauté"
              description="Réseaux et chaînes Onivoid"
              links={socialLinks}
              columns={4}
            />
          </div>

          <div className="flex flex-col gap-4">
            <SettingsSection
              title="Introduction"
              description="Guide de premier lancement"
            >
              <OnboardingResetSection />
            </SettingsSection>

            <SettingsSection
              title="Système"
              description="Comportement au démarrage de Windows"
            >
              <SettingRow
                title="Lancer au démarrage"
                description="Démarre minimisé dans la barre système"
                htmlFor="auto-startup"
              >
                <Switch
                  id="auto-startup"
                  checked={vm.autoStartupEnabled}
                  onCheckedChange={vm.handleAutoStartupToggle}
                  disabled={vm.loading || vm.checkingAutoStartup}
                />
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              title="Mises à jour automatiques"
              description="Traductions SCEFRA en arrière-plan"
              footer="Installe automatiquement les traductions disponibles pour les versions du jeu déjà traduites."
            >
              <SettingRow
                title="Service de fond"
                description="Vérifie les mises à jour de la traduction en arrière-plan"
                htmlFor="background-service"
              >
                <ServiceStatus
                  running={vm.serviceRunning}
                  enabled={vm.config.enabled}
                  loading={vm.loading}
                />
                <Switch
                  id="background-service"
                  checked={vm.config.enabled}
                  onCheckedChange={vm.handleServiceToggle}
                  disabled={vm.loading}
                />
              </SettingRow>
              <SettingRow
                title="Intervalle"
                description="Min. 5 min — recommandé 5–10 min"
                htmlFor="check-interval"
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="check-interval"
                    type="number"
                    min={5}
                    max={1440}
                    value={vm.config.check_interval_minutes}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!Number.isNaN(value)) {
                        vm.setConfig({
                          ...vm.config,
                          check_interval_minutes: value,
                        });
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!Number.isNaN(value) && value >= 5) {
                        vm.handleIntervalChange(value);
                      }
                    }}
                    className="h-8 w-20"
                    disabled={vm.loading}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </SettingRow>
            </SettingsSection>

            <ExternalLinksPanel
              title="Services externes"
              description="Outils et ressources partenaires"
              links={serviceLinks}
              columns={2}
            />
          </div>
        </div>
      </div>
    </PageMotion>
  );
}
