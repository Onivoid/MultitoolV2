import { useEffect, useMemo, useState } from "react";
import Synthesis from "@/components/synthesis";
import { useThemeStore } from "@/stores/theme-store";
import {
  deriveSynthesisColor1,
  loadAndApplyTheme,
} from "@/utils/custom-theme-provider";

export function AppBackground() {
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const synthesisColor2 = useThemeStore((state) => state.synthesisColor2);
  const synthesisSpeed = useThemeStore((state) => state.synthesisSpeed);
  const synthesisGlowIntensity = useThemeStore((state) => state.synthesisGlowIntensity);
  const synthesisDistortion = useThemeStore((state) => state.synthesisDistortion);
  const synthesisComplexity = useThemeStore((state) => state.synthesisComplexity);
  const synthesisFlowFrequency = useThemeStore((state) => state.synthesisFlowFrequency);
  const synthesisScale = useThemeStore((state) => state.synthesisScale);
  const synthesisContrast = useThemeStore((state) => state.synthesisContrast);
  const overlayOpacity = useThemeStore((state) => state.overlayOpacity);

  const [isVisible, setIsVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const color1 = useMemo(() => deriveSynthesisColor1(primaryColor), [primaryColor]);

  const speed = useMemo(
    () => synthesisSpeed * (prefersReducedMotion ? 0.35 : 1),
    [synthesisSpeed, prefersReducedMotion],
  );

  useEffect(() => {
    loadAndApplyTheme();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden"
        aria-hidden
      >
        {isVisible && (
          <Synthesis
            className="h-screen w-screen"
            speed={speed}
            color1={color1}
            color2={synthesisColor2}
            color3={primaryColor}
            scale={synthesisScale}
            complexity={synthesisComplexity}
            distortion={synthesisDistortion}
            glowIntensity={synthesisGlowIntensity}
            flowFrequency={synthesisFlowFrequency}
            contrast={synthesisContrast}
            backgroundColor={color1}
            frameloop={isVisible ? "always" : "never"}
          />
        )}
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ backgroundColor: `hsl(var(--primary) / ${overlayOpacity})` }}
        aria-hidden
      />
    </>
  );
}
