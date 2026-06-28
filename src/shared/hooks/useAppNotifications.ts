import { useEffect, useMemo, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { useTranslationData } from "@/features/translation/hooks/useTranslationData";
import { isPublicReleaseVersionKey } from "@/features/translation/translation.lib";
import { getBuildInfo } from "@/utils/buildInfo";

export interface AppNotificationBadges extends Record<string, boolean> {
  "/updates": boolean;
  "/traduction": boolean;
}

export function useAppNotifications(): {
  appUpdateAvailable: boolean;
  translationUpdateAvailable: boolean;
  routeBadges: AppNotificationBadges;
} {
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);
  const { paths } = useTranslationData({ pollVersionStates: true });

  useEffect(() => {
    let cancelled = false;
    void getBuildInfo().then((info) => {
      if (!info.canAutoUpdate || cancelled) return;
      return check().then((u) => {
        if (!cancelled) setAppUpdateAvailable(Boolean(u?.available));
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const translationUpdateAvailable = useMemo(() => {
    if (!paths?.versions) return false;
    for (const [key, version] of Object.entries(paths.versions)) {
      if (!isPublicReleaseVersionKey(key)) continue;
      if (version.translated && !version.up_to_date) return true;
    }
    return false;
  }, [paths]);

  return {
    appUpdateAvailable,
    translationUpdateAvailable,
    routeBadges: {
      "/updates": appUpdateAvailable,
      "/traduction": translationUpdateAvailable,
    },
  };
}
