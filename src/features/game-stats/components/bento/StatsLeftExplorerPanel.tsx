import { useState } from "react";
import { Radar, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsBentoTile } from "@/features/game-stats/components/bento/StatsBentoTile";
import { StatsRadarExplorerBody } from "@/features/game-stats/components/bento/StatsRadarExplorerBody";
import { StatsSpendingChartBody } from "@/features/game-stats/components/bento/StatsSpendingChartBody";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

type ExplorerTab = "repartition" | "spending";

const TAB_META: Record<
  ExplorerTab,
  { title: string; hint: string; icon: JSX.Element }
> = {
  repartition: {
    title: "Répartition",
    hint: "Graphiques radar par catégorie (systèmes, véhicules, missions, dépenses par boutique).",
    icon: <Radar className="h-3.5 w-3.5 text-primary" aria-hidden />,
  },
  spending: {
    title: "Évolution des dépenses",
    hint: "Dépenses cumulées par jour (achats boutique réussis dans les logs).",
    icon: <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />,
  },
};

export interface StatsLeftExplorerPanelProps {
  snapshot: GameStatsSnapshot;
  className?: string;
}

export function StatsLeftExplorerPanel({
  snapshot,
  className,
}: StatsLeftExplorerPanelProps) {
  const [tab, setTab] = useState<ExplorerTab>("repartition");
  const meta = TAB_META[tab];

  return (
    <StatsBentoTile
      title={meta.title}
      icon={meta.icon}
      hint={meta.hint}
      className={className}
      bodyClassName="flex min-h-0 flex-1 flex-col px-2 pb-1 pt-2"
    >
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ExplorerTab)}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <TabsList className="grid h-9 w-full shrink-0 grid-cols-2 bg-primary/5">
          <TabsTrigger
            value="repartition"
            className="text-xs data-[state=active]:bg-primary/15"
          >
            Répartition
          </TabsTrigger>
          <TabsTrigger
            value="spending"
            className="text-xs data-[state=active]:bg-primary/15"
          >
            Évolution des dépenses
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="repartition"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <StatsRadarExplorerBody snapshot={snapshot} />
        </TabsContent>

        <TabsContent
          value="spending"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <StatsSpendingChartBody snapshot={snapshot} className="flex-1" />
        </TabsContent>
      </Tabs>
    </StatsBentoTile>
  );
}
