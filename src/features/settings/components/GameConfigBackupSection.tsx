import { useCallback, useEffect, useMemo, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SettingRow } from "@/shared/components/v3/SettingRow";
import {
  gameConfigBackupService,
  type BackupTargetStatus,
} from "@/features/settings/gameConfigBackup.service";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

interface ScVersionEntry {
  key: string;
  path: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function truncatePath(path: string, max = 48): string {
  if (path.length <= max) {
    return path;
  }
  return `…${path.slice(-max + 1)}`;
}

export function GameConfigBackupSection() {
  const [channels, setChannels] = useState<ScVersionEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [targets, setTargets] = useState<BackupTargetStatus[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeGameLog, setIncludeGameLog] = useState(true);
  const [includeLogBackups, setIncludeLogBackups] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backupOptions = { includeGameLog, includeLogBackups };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingChannels(true);
      setError(null);
      try {
        const res = await invokeCommand<{
          versions: Record<string, { path: string }>;
        }>(TAURI_COMMANDS.getStarCitizenVersions);
        const entries = Object.entries(res.versions ?? {})
          .map(([key, info]) => ({ key, path: info.path }))
          .sort((a, b) => a.key.localeCompare(b.key));
        if (!cancelled) {
          setChannels(entries);
          if (entries.length > 0) {
            setSelectedPath(entries[0].path);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoadingChannels(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.path === selectedPath),
    [channels, selectedPath],
  );

  const refreshTargets = useCallback(
    async (path: string) => {
      if (!path) {
        setTargets([]);
        return;
      }
      setLoadingTargets(true);
      setError(null);
      try {
        const list = await gameConfigBackupService.listTargets(path, backupOptions);
        setTargets(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setTargets([]);
      } finally {
        setLoadingTargets(false);
      }
    },
    [includeGameLog, includeLogBackups],
  );

  useEffect(() => {
    void refreshTargets(selectedPath);
  }, [selectedPath, refreshTargets]);

  const totalFiles = targets.reduce((n, t) => n + t.fileCount, 0);
  const totalBytes = targets.reduce((n, t) => n + t.totalBytes, 0);

  const handleExport = async () => {
    if (!selectedPath) {
      return;
    }
    const channelLabel = selectedChannel?.key ?? "SC";
    const defaultName = `multitool-sc-config-${channelLabel}-${new Date().toISOString().slice(0, 10)}.zip`;
    const dest = await save({
      title: "Exporter la configuration Star Citizen",
      defaultPath: defaultName,
      filters: [{ name: "Archive ZIP", extensions: ["zip"] }],
    });
    if (!dest) {
      return;
    }

    setExporting(true);
    setStatusMessage(null);
    setError(null);
    try {
      const result = await gameConfigBackupService.exportZip(
        selectedPath,
        dest,
        backupOptions,
      );
      setStatusMessage(
        `Export terminé : ${result.filesPacked} fichier${result.filesPacked !== 1 ? "s" : ""} (${formatBytes(result.bytesPacked)}).` +
          (result.skipped.length > 0
            ? ` ${result.skipped.length} ignoré${result.skipped.length !== 1 ? "s" : ""}.`
            : ""),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <SettingRow
        title="Canal Star Citizen"
        description="Installation à inclure dans l’archive"
      >
        {loadingChannels ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : channels.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Aucune installation détectée
          </span>
        ) : (
          <Select value={selectedPath} onValueChange={setSelectedPath}>
            <SelectTrigger className="h-8 w-full max-w-[280px]">
              <SelectValue placeholder="Choisir un canal" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((ch) => (
                <SelectItem key={ch.path} value={ch.path}>
                  {ch.key} — {truncatePath(ch.path)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </SettingRow>

      <SettingRow
        title="Inclure Game.log"
        description="Journal de session en cours"
        htmlFor="backup-game-log"
      >
        <Switch
          id="backup-game-log"
          checked={includeGameLog}
          onCheckedChange={setIncludeGameLog}
        />
      </SettingRow>

      <SettingRow
        title="Inclure logbackups"
        description="Archives de logs RSI (max. 40 fichiers)"
        htmlFor="backup-log-backups"
      >
        <Switch
          id="backup-log-backups"
          checked={includeLogBackups}
          onCheckedChange={setIncludeLogBackups}
        />
      </SettingRow>

      {totalBytes > 50 * 1024 * 1024 && (
        <p className="px-4 text-ui-caption text-amber-300/90">
          Archive volumineuse ({formatBytes(totalBytes)}) — l&apos;export peut prendre
          un moment.
        </p>
      )}

      <SettingRow
        title="Contenu détecté"
        description={
          loadingTargets
            ? "Analyse en cours…"
            : totalFiles > 0
              ? `${totalFiles} fichier${totalFiles !== 1 ? "s" : ""} · ${formatBytes(totalBytes)}`
              : "Aucun fichier de config trouvé pour ce canal"
        }
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!selectedPath || loadingTargets || exporting || totalFiles === 0}
          onClick={() => void handleExport()}
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Export…
            </>
          ) : (
            "Exporter en ZIP…"
          )}
        </Button>
      </SettingRow>

      {targets.length > 0 && !loadingTargets ? (
        <ul className="px-4 pb-3 text-xs text-muted-foreground">
          {targets.map((t) => (
            <li key={t.key} className="flex justify-between gap-2 py-0.5">
              <span className={t.exists ? "" : "opacity-50"}>{t.label}</span>
              <span className="shrink-0 tabular-nums">
                {t.exists ? `${t.fileCount} · ${formatBytes(t.totalBytes)}` : "—"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {statusMessage ? (
        <p className="px-4 pb-3 text-xs text-green-400/90">{statusMessage}</p>
      ) : null}
      {error ? <p className="px-4 pb-3 text-xs text-destructive">{error}</p> : null}
    </>
  );
}
