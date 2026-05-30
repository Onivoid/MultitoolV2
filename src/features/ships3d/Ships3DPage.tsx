import { useState } from "react";
import PageMotion from "@/shared/components/PageMotion";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import {
  Ships3DToolbar,
  SHIPS_URL,
} from "@/features/ships3d/components/Ships3DToolbar";

export default function Ships3DPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2 pb-[2px]">
      <Ships3DToolbar />

      <section className="settings-section relative min-h-0 flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <PageWaveLoader message="Chargement du visualiseur 3D…" />
          </div>
        )}

        <iframe
          src={SHIPS_URL}
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          title="Vaisseaux 3D — ADI Star Citizen Maps"
          data-no-window-drag
        />
      </section>
    </PageMotion>
  );
}
