import { useEffect, useState } from "react";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { ONBOARDING_EVENT } from "@/features/settings/components/OnboardingResetSection";

interface OnboardingState {
  onboardingDone: boolean;
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const state = await invokeCommand<OnboardingState>(
          TAURI_COMMANDS.getOnboardingState,
        );
        if (!cancelled) {
          setShow(!state.onboardingDone);
        }
      } catch {
        if (!cancelled) setShow(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void check();
    const onShow = () => setShow(true);
    window.addEventListener(ONBOARDING_EVENT, onShow);
    return () => {
      cancelled = true;
      window.removeEventListener(ONBOARDING_EVENT, onShow);
    };
  }, []);

  if (!ready) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {show && <OnboardingWizard onComplete={() => setShow(false)} />}
    </>
  );
}
