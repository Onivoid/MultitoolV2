import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingRow } from "@/shared/components/v3/SettingRow";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

const ONBOARDING_EVENT = "multitool:show-onboarding";

export function OnboardingResetSection() {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await invokeCommand(TAURI_COMMANDS.resetOnboarding);
      window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingRow
      title="Relancer l'introduction"
      description="Réaffiche le guide de premier lancement"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void handleReset()}
      >
        {loading ? "…" : "Relancer"}
      </Button>
    </SettingRow>
  );
}

export { ONBOARDING_EVENT };
