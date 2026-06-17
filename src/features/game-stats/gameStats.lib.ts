import type {
  GameStatsSnapshot,
  StatSummaryItem,
} from "@/features/game-stats/gameStats.types";

/** Formate une durée en secondes (ex. « 6 h 58 min »). */
export function formatPlaytime(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`;
  }
  if (hours > 0) {
    return `${hours} h`;
  }
  if (minutes > 0) {
    return `${minutes} min`;
  }
  return "< 1 min";
}

export function formatStatsPeriod(snapshot: GameStatsSnapshot): string {
  return snapshot.period.label || "période inconnue";
}

/** Affichage lisible d'un identifiant véhicule SC (ORIG_m80 → ORIG m80). */
export function formatVehicleTypeLabel(vehicleType: string): string {
  return vehicleType.split("_").join(" ");
}

/** Montant aUEC lisible (arrondi entier). */
export function formatAuec(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  return `${n.toLocaleString("fr-FR")}\u00a0aUEC`;
}

/** Axe graphique / montants compacts avec séparateurs FR. */
export function formatAuecCompact(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = Math.round(m * 10) / 10;
    return `${rounded.toLocaleString("fr-FR")}\u00a0M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    const rounded = Math.round(k * 10) / 10;
    return `${rounded.toLocaleString("fr-FR")}\u00a0k`;
  }
  return n.toLocaleString("fr-FR");
}

/** Pourcentage entier 0–100+ (peut dépasser 100 si métriques divergent). */
export function formatPilotingSharePercent(
  pilotingSeconds: number,
  playtimeSeconds: number,
): string {
  if (playtimeSeconds <= 0) {
    return "—";
  }
  const pct = Math.round((pilotingSeconds / playtimeSeconds) * 100);
  return `${pct} %`;
}

function defaultPiloting(snapshot: GameStatsSnapshot) {
  return snapshot.piloting ?? { totalSeconds: 0, intervalCount: 0 };
}

function defaultSpending(snapshot: GameStatsSnapshot) {
  return (
    snapshot.spending ?? {
      totalSpent: 0,
      purchaseCount: 0,
      byDay: [],
      byShop: [],
    }
  );
}

function hasMissionStats(missions: GameStatsSnapshot["missions"]): boolean {
  return missions.completed > 0 || missions.abandoned > 0 || missions.failed > 0;
}

export function resolveBlueprintUnlockedStat(
  snapshot: GameStatsSnapshot | null,
  journalUniqueCount?: number | null,
): StatSummaryItem | null {
  if (journalUniqueCount != null && journalUniqueCount > 0) {
    return {
      label: "Schémas débloqués",
      value: String(journalUniqueCount),
      hint: "Nombre d’IDs catalogue uniques : journal Multitool + marquages manuels (prioritaire sur l’estimation extraite des logs).",
    };
  }
  if (snapshot && snapshot.blueprints.totalUnlocked > 0) {
    return {
      label: "Schémas débloqués",
      value: String(snapshot.blueprints.totalUnlocked),
      hint: "Estimation extraite des logs Game.log (journal Multitool vide ou indisponible).",
    };
  }
  return null;
}

export function snapshotHasHomeStats(
  snapshot: GameStatsSnapshot | null,
  journalBlueprintCount?: number | null,
): boolean {
  if (journalBlueprintCount != null && journalBlueprintCount > 0) {
    return true;
  }
  if (!snapshot) {
    return false;
  }
  const spending = defaultSpending(snapshot);
  const piloting = defaultPiloting(snapshot);
  return (
    snapshot.playtime.sessionCount > 0 ||
    snapshot.playtime.totalSeconds > 0 ||
    hasMissionStats(snapshot.missions) ||
    snapshot.blueprints.totalUnlocked > 0 ||
    snapshot.vehicles.favorite != null ||
    snapshot.starSystems.favorite != null ||
    piloting.totalSeconds > 0 ||
    spending.purchaseCount > 0
  );
}

/** Résumé affiché sur l'encart accueil (extensible). */
export function getHomeSummaryItems(
  snapshot: GameStatsSnapshot | null,
  journalUniqueCount?: number | null,
): StatSummaryItem[] {
  if (!snapshotHasHomeStats(snapshot, journalUniqueCount) && !snapshot) {
    return [];
  }
  if (!snapshotHasHomeStats(snapshot, journalUniqueCount)) {
    const bpOnly = resolveBlueprintUnlockedStat(snapshot, journalUniqueCount);
    return bpOnly ? [bpOnly] : [];
  }
  if (!snapshot) {
    const bpOnly = resolveBlueprintUnlockedStat(null, journalUniqueCount);
    return bpOnly ? [bpOnly] : [];
  }

  const items: StatSummaryItem[] = [];

  if (snapshot.playtime.totalSeconds > 0) {
    items.push({
      label: "Temps de jeu",
      value: formatPlaytime(snapshot.playtime.totalSeconds),
    });
  }

  const piloting = defaultPiloting(snapshot);
  if (piloting.totalSeconds > 0) {
    items.push({
      label: "Temps de pilotage",
      value: formatPlaytime(piloting.totalSeconds),
      hint: "Durée cumulée avec un token de contrôle vaisseau actif (grant → release dans les logs).",
    });
  }

  if (hasMissionStats(snapshot.missions)) {
    items.push({
      label: "Missions terminées",
      value: String(snapshot.missions.completed),
    });
    if (snapshot.missions.failed > 0) {
      items.push({
        label: "Missions échouées",
        value: String(snapshot.missions.failed),
      });
    }
  }

  const blueprintStat = resolveBlueprintUnlockedStat(snapshot, journalUniqueCount);
  if (blueprintStat) {
    items.push(blueprintStat);
  }

  if (snapshot.vehicles.favorite && snapshot.vehicles.favoriteCount > 0) {
    const vehicleLabel = formatVehicleTypeLabel(snapshot.vehicles.favorite);
    const sessions = snapshot.vehicles.favoriteCount;
    items.push({
      label: "Véhicule favori",
      value: vehicleLabel,
      hint: `Vaisseau le plus souvent utilisé selon vos logs Star Citizen. Chaque fois que vous quittez le siège pilote de ce type de vaisseau, une session est comptée (${sessions} session${sessions > 1 ? "s" : ""} pour ${vehicleLabel}). Les véhicules ennemis ne sont pas pris en compte.`,
    });
  }

  if (snapshot.starSystems.favorite && snapshot.starSystems.favoriteCount > 0) {
    const system = snapshot.starSystems.favorite;
    const visits = snapshot.starSystems.favoriteCount;
    items.push({
      label: "Système favori",
      value: system,
      hint: `Système où vous êtes passé le plus souvent. On compte une visite quand les logs indiquent que vous êtes passé d’un autre système (ou d’une zone inconnue) vers ce système — pas chaque mission ou action dedans. Détection via chemins de zone / inventaire (Pyro, Stanton, Nyx…). ${system} : ${visits} visite${visits > 1 ? "s" : ""}.`,
    });
  }

  const spending = defaultSpending(snapshot);
  if (spending.purchaseCount > 0) {
    items.push({
      label: "Dépenses boutique",
      value: formatAuec(spending.totalSpent),
      hint: "Achats en boutique réussis détectés dans les logs.",
    });
  }

  return items;
}
