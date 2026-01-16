import { Button } from "@/components/ui/button";
import { FolderOpen, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "@/hooks/use-toast";

export default function ActionsMenu({ setCacheInfos }: { setCacheInfos: any }) {
    const { toast } = useToast();
    const handleOpenCacheFolder = async () => {
        try {
            const res = await invoke("open_cache_folder");
            if (res) {
                toast({
                    title: "Dossier ouvert",
                    description: "Le dossier du cache a bien été ouvert.",
                    success: "true",
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: "Erreur lors de l'ouverture",
                description: `Une erreur est survenue : ${error}`,
                success: "false",
                duration: 3000,
            });
        }
    };
    const handleClearCache = async () => {
        try {
            const res = await invoke("clear_cache");
            if (res) {
                setCacheInfos([]);
                toast({
                    title: "Cache nettoyé",
                    description: "Le cache a bien été nettoyé.",
                    success: "true",
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: "Erreur lors du nettoyage",
                description: `Une erreur est survenue : ${error}`,
                success: "false",
                duration: 3000,
            });
        }
    };
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCacheFolder}
            >
                <FolderOpen className="h-4 w-4 mr-2" />
                Ouvrir le dossier
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer tout
            </Button>
        </div>
    );
}
