import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  HardDrive,
  Languages,
  Newspaper,
  Package,
  Server,
  Sparkles,
  Gamepad2,
  Radio,
} from "lucide-react";
import type { HomeWidgetType } from "@/features/home/dashboard/homeDashboard.types";
import { GameStatsWidgetContent } from "@/features/home/dashboard/widgets/GameStatsWidgetContent";
import { TopRoutesWidgetContent } from "@/features/home/dashboard/widgets/TopRoutesWidgetContent";
import { BlueprintsWidgetContent } from "@/features/home/dashboard/widgets/BlueprintsWidgetContent";
import { TranslationWidgetContent } from "@/features/home/dashboard/widgets/TranslationWidgetContent";
import { CacheWidgetContent } from "@/features/home/dashboard/widgets/CacheWidgetContent";
import { PerformanceWidgetContent } from "@/features/home/dashboard/widgets/PerformanceWidgetContent";
import { NewsWidgetContent } from "@/features/home/dashboard/widgets/NewsWidgetContent";
import { RsiStatusWidgetContent } from "@/features/home/dashboard/widgets/RsiStatusWidgetContent";
import { ScVersionsWidgetContent } from "@/features/home/dashboard/widgets/ScVersionsWidgetContent";
import { HangarExecWidgetContent } from "@/features/hangar-exec/components/HangarExecWidgetContent";

export interface HomeWidgetDefinition {
  type: HomeWidgetType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  Content: ComponentType;
  /** Lien « Voir tout » dans l'en-tête du widget (optionnel). */
  headerRoute?: string;
}

export const HOME_WIDGET_REGISTRY: HomeWidgetDefinition[] = [
  {
    type: "top_routes",
    label: "Fonctionnalités utilisées",
    description: "Vos 3 pages les plus visitées.",
    icon: Sparkles,
    Content: TopRoutesWidgetContent,
  },
  {
    type: "game_stats",
    label: "Statistiques",
    description: "Résumé des stats extraites des logs.",
    icon: BarChart3,
    Content: GameStatsWidgetContent,
    headerRoute: "/statistiques",
  },
  {
    type: "translation",
    label: "Traduction",
    description: "État des traductions par version et actions rapides.",
    icon: Languages,
    Content: TranslationWidgetContent,
    headerRoute: "/traduction",
  },
  {
    type: "blueprints",
    label: "Schémas",
    description: "Surveillance Game.log, sync et derniers schémas reçus.",
    icon: Package,
    Content: BlueprintsWidgetContent,
    headerRoute: "/blueprints",
  },
  {
    type: "cache",
    label: "Cache",
    description: "Dossiers cache détectés, recherche et nettoyage rapide.",
    icon: HardDrive,
    Content: CacheWidgetContent,
    headerRoute: "/cache",
  },
  {
    type: "system_performance",
    label: "Performance",
    description: "Utilisation CPU, GPU et mémoire en temps réel.",
    icon: Activity,
    Content: PerformanceWidgetContent,
  },
  {
    type: "news",
    label: "News Star Citizen",
    description: "Dernières actualités RSI.",
    icon: Newspaper,
    Content: NewsWidgetContent,
    headerRoute: "/news",
  },
  {
    type: "rsi_status",
    label: "Statut RSI",
    description: "État des serveurs et services Star Citizen.",
    icon: Server,
    Content: RsiStatusWidgetContent,
  },
  {
    type: "sc_versions",
    label: "Versions SC",
    description: "État des mises à jour jeu par canal (RSI Launcher).",
    icon: Gamepad2,
    Content: ScVersionsWidgetContent,
  },
  {
    type: "hangar_exec",
    label: "Hangar Executive",
    description: "Statut PYAM en temps réel et compte à rebours.",
    icon: Radio,
    Content: HangarExecWidgetContent,
    headerRoute: "/hangar-exec",
  },
];

export function getWidgetDefinition(
  type: HomeWidgetType,
): HomeWidgetDefinition | undefined {
  return HOME_WIDGET_REGISTRY.find((w) => w.type === type);
}
