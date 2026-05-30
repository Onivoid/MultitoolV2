import { useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { getBuildInfo, type BuildInfo } from "@/utils/buildInfo";

export type CheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "error"
  | "unsupported";

export function useUpdate() {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [update, setUpdate] = useState<Update | null>(null);
  const [currentVersion, setCurrentVersion] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const totalSize = useRef(0);
  const downloaded = useRef(0);

  useEffect(() => {
    getVersion()
      .then(setCurrentVersion)
      .catch(() => {});
    getBuildInfo()
      .then(async (info) => {
        setBuildInfo(info);
        if (!info.canAutoUpdate) {
          setStatus("unsupported");
          return;
        }
        await runCheck(info);
      })
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runCheck(info?: BuildInfo) {
    const resolved = info ?? buildInfo ?? (await getBuildInfo());
    if (!resolved.canAutoUpdate) {
      setStatus("unsupported");
      return;
    }

    setStatus("checking");
    setError("");
    setUpdate(null);
    try {
      const u = await check();
      if (u?.available) {
        setUpdate(u);
        setStatus("available");
      } else {
        setStatus("up-to-date");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function downloadAndInstall() {
    if (!update) return;
    try {
      setDownloading(true);
      downloaded.current = 0;
      totalSize.current = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize.current = event.data.contentLength ?? 0;
            setDownloadProgress(0);
            break;
          case "Progress":
            downloaded.current += event.data.chunkLength;
            if (totalSize.current > 0) {
              setDownloadProgress(
                Math.min(
                  99,
                  Math.round((downloaded.current / totalSize.current) * 100),
                ),
              );
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      await relaunch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
      setDownloading(false);
    }
  }

  const canUseUpdater = buildInfo?.canAutoUpdate ?? false;

  return {
    status,
    update,
    currentVersion,
    error,
    downloading,
    downloadProgress,
    buildInfo,
    canUseUpdater,
    runCheck: () => runCheck(),
    downloadAndInstall,
  };
}
