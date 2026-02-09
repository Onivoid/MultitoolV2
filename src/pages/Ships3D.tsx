import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Rocket, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/custom/PageHeader";
import openExternal from "@/utils/external";

const SHIPS_URL = "https://maps.adi.sc/";

export default function Ships3D() {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex w-full flex-col h-full"
        >
            <div className="flex items-center justify-between pr-3">
                <PageHeader
                    icon={<Rocket className="h-6 w-6" />}
                    title="Vaisseaux 3D"
                    description="Visualiseur 3D interactif des vaisseaux Star Citizen — par ADI"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExternal(SHIPS_URL)}
                    className="shrink-0"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans le navigateur
                </Button>
            </div>

            <div className="relative mt-2 mb-2 mr-3 rounded-lg overflow-hidden border border-border/50" style={{ height: "calc(100vh - 145px)" }}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Chargement du visualiseur 3D...</span>
                        </div>
                    </div>
                )}
                <iframe
                    src={SHIPS_URL}
                    className="w-full h-full border-0"
                    onLoad={() => setIsLoading(false)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    title="Vaisseaux 3D - ADI Star Citizen Maps"
                />
            </div>
        </motion.div>
    );
}
