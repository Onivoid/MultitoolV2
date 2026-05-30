import { useAnimatedLoadingDots } from "@/shared/hooks/useAnimatedLoadingDots";

interface FetchingOverlayProps {
  message?: string;
}

export default function FetchingOverlay({
  message = "Récupération des données",
}: FetchingOverlayProps) {
  const dotCount = useAnimatedLoadingDots(true);

  return (
    <div className="flex h-screen w-full flex-row gap-3 items-center justify-center">
      <p>
        {message}{" "}
        {Array.from({ length: dotCount }).map((_, i) => (
          <span key={i}>.</span>
        ))}
      </p>
    </div>
  );
}
