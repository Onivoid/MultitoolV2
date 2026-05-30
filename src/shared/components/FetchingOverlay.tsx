import { useAnimatedLoadingDots } from "@/shared/hooks/useAnimatedLoadingDots";
import { PAGE_CENTER, PAGE_ROOT } from "@/shared/components/pageStyles";

interface FetchingOverlayProps {
  message?: string;
}

export default function FetchingOverlay({
  message = "Récupération des données",
}: FetchingOverlayProps) {
  const dotCount = useAnimatedLoadingDots(true);

  return (
    <div className={PAGE_ROOT}>
      <div className={`${PAGE_CENTER} flex-row gap-3`}>
        <p>
          {message}{" "}
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i}>.</span>
          ))}
        </p>
      </div>
    </div>
  );
}
