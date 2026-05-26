import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    RefreshCw,
    ScrollText,
    Play,
    Square,
    History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/custom/PageHeader";
import BlueprintListToolbar from "@/components/blueprints/BlueprintListToolbar";
import BlueprintRow from "@/components/blueprints/BlueprintRow";
import { invoke } from "@tauri-apps/api/core";
import logger from "@/utils/logger";
import {
    type BlueprintEntry,
    type BlueprintSortKey,
    filterBlueprints,
    getUniqueOwners,
    loadBlueprintSortKey,
    saveBlueprintSortKey,
    sortBlueprints,
} from "@/lib/blueprintList";

interface BlueprintStoreFile {
    schemaVersion: number;
    blueprints: BlueprintEntry[];
}

interface GamelogWatcherStatus {
    watching: boolean;
    logPath: string | null;
    blueprintCount: number;
}

export default function Blueprints() {
    const { toast } = useToast();
    const [blueprints, setBlueprints] = useState<BlueprintEntry[]>([]);
    const [status, setStatus] = useState<GamelogWatcherStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isTogglingWatch, setIsTogglingWatch] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [sortKey, setSortKey] = useState<BlueprintSortKey>(loadBlueprintSortKey);

    const handleSortChange = useCallback((key: BlueprintSortKey) => {
        setSortKey(key);
        saveBlueprintSortKey(key);
    }, []);

    const uniqueOwners = useMemo(() => getUniqueOwners(blueprints), [blueprints]);

    const filteredBlueprints = useMemo(
        () =>
            sortBlueprints(
                filterBlueprints(blueprints, searchQuery, ownerFilter),
                sortKey
            ),
        [blueprints, searchQuery, ownerFilter, sortKey]
    );

    const loadData = useCallback(async (silent = false) => {
        try {
            const [store, watcherStatus] = await Promise.all([
                invoke<BlueprintStoreFile>("load_gamelog_blueprints"),
                invoke<GamelogWatcherStatus>("get_gamelog_watcher_status"),
            ]);
            setBlueprints(
                (store.blueprints ?? []).map((bp) => ({
                    ...bp,
                    owner: bp.owner ?? "",
                }))
            );
            setStatus(watcherStatus);
            if (!silent) {
                toast({
                    title: "Liste mise à jour",
                    description: `${store.blueprints?.length ?? 0} blueprint(s)`,
                    variant: "success",
                });
            }
        } catch (error) {
            logger.error("Erreur chargement blueprints:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les blueprints",
                variant: "destructive",
            });
        }
    }, [toast]);

    useEffect(() => {
        setIsLoading(true);
        loadData(true).finally(() => setIsLoading(false));
    }, [loadData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData(false);
        setIsRefreshing(false);
    };

    const handleStartWatch = async () => {
        setIsTogglingWatch(true);
        try {
            await invoke("start_gamelog_watcher");
            await loadData(true);
            toast({
                title: "Surveillance démarrée",
                description: "Le Game.log LIVE est suivi en arrière-plan",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsTogglingWatch(false);
        }
    };

    const handleStopWatch = async () => {
        setIsTogglingWatch(true);
        try {
            await invoke("stop_gamelog_watcher");
            await loadData(true);
            toast({
                title: "Surveillance arrêtée",
                description: "La capture du Game.log est inactive",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsTogglingWatch(false);
        }
    };

    const handleImportHistory = async () => {
        setIsImporting(true);
        try {
            const result = await invoke<{
                imported: number;
                total: number;
                filesScanned: number;
                matchesFound: number;
                filesWithMatches: number;
                uniqueProductsFound: number;
                filesFailed: number;
                logDirectory: string;
                gameLogPath: string;
                readErrors: string[];
                removedWithoutOwner: number;
            }>("import_blueprints_from_logbackups", { includeCurrent: true });
            await loadData(true);
            const errHint =
                result.filesFailed > 0
                    ? ` — ${result.filesFailed} fichier(s) illisible(s)`
                    : "";
            const pruneHint =
                result.removedWithoutOwner > 0
                    ? ` — ${result.removedWithoutOwner} sans compte retiré(s)`
                    : "";
            const pathHint = `LIVE : ${result.gameLogPath}`;
            toast({
                title:
                    result.matchesFound > 0
                        ? "Import terminé"
                        : "Aucune occurrence dans les logs scannés",
                description:
                    result.matchesFound > 0
                        ? `${result.matchesFound} ligne(s), ${result.uniqueProductsFound} schéma(s) distinct(s) dans ${result.filesWithMatches}/${result.filesScanned} fichier(s) — ${result.imported} nouveau(x), ${result.total} au total${pruneHint}${errHint}`
                        : `${result.filesScanned} fichier(s) scanné(s), 0 ligne « Schémas reçu » / « Received Blueprint ». ${pathHint}${errHint}. Recompilez l'app si vous venez de mettre à jour.`,
                variant: result.matchesFound > 0 ? "success" : "destructive",
            });
            if (result.readErrors.length > 0) {
                logger.error("Erreurs lecture logs:", result.readErrors);
            }
        } catch (error) {
            toast({
                title: "Erreur d'import",
                description: String(error),
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
        }
    };

    const watching = status?.watching ?? false;
    const hasBlueprints = blueprints.length > 0;
    const hasFilteredResults = filteredBlueprints.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex max-h-[calc(100vh-50px)] w-full flex-1 flex-col"
        >
            <div className="flex shrink-0 flex-col gap-4 pr-3">
                <div className="flex items-start justify-between gap-3">
                    <PageHeader
                        icon={<ScrollText className="h-6 w-6" />}
                        title="Blueprints"
                        description="Blueprints débloqués détectés depuis le Game.log Star Citizen (LIVE)"
                    />
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing || isLoading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                            Rafraîchir
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImportHistory}
                            disabled={isImporting || isLoading}
                        >
                            {isImporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <History className="mr-2 h-4 w-4" />
                            )}
                            Importer l'historique
                        </Button>
                        {watching ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleStopWatch}
                                disabled={isTogglingWatch}
                            >
                                <Square className="mr-2 h-4 w-4" />
                                Arrêter
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleStartWatch}
                                disabled={isTogglingWatch}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Démarrer
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={watching ? "default" : "secondary"}>
                            {watching ? "Surveillance active" : "Surveillance arrêtée"}
                        </Badge>
                        <span className="text-muted-foreground">
                            {status?.blueprintCount ?? 0} blueprint(s) enregistré(s)
                        </span>
                    </div>
                    {status?.logPath && (
                        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                            {status.logPath}
                        </p>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : !hasBlueprints ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
                    <p>Aucun blueprint enregistré pour le moment.</p>
                    <p className="text-sm">
                        Démarrez la surveillance ou importez l'historique depuis les
                        logbackups.
                    </p>
                </div>
            ) : (
                <>
                    <BlueprintListToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        sortKey={sortKey}
                        onSortChange={handleSortChange}
                        ownerFilter={ownerFilter}
                        onOwnerFilterChange={setOwnerFilter}
                        availableOwners={uniqueOwners}
                        filteredCount={filteredBlueprints.length}
                        totalCount={blueprints.length}
                    />

                    {!hasFilteredResults ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
                            <p>
                                Aucun schéma pour «{" "}
                                <span className="font-medium text-foreground">
                                    {searchQuery.trim()}
                                </span>
                                »
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("");
                                    setOwnerFilter("");
                                }}
                            >
                                Effacer les filtres
                            </Button>
                        </div>
                    ) : (
                        <div className="app-scroll-root min-h-0 flex-1 overflow-x-hidden overflow-y-auto mt-2 pb-4 pr-3">
                            <div className="flex flex-col gap-2">
                                {filteredBlueprints.map((bp) => (
                                    <BlueprintRow
                                        key={`${bp.owner}-${bp.productName}-${bp.ts}`}
                                        blueprint={bp}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}
