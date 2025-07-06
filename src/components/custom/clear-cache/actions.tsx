import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";
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
        <DropdownMenu>
            <DropdownMenuTrigger className="mt-2">
                <Ellipsis className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    className="hover:cursor-pointer"
                    onClick={handleClearCache}
                >
                    Nettoyer le cache
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="hover:cursor-pointer"
                    onClick={handleOpenCacheFolder}
                >
                    Ouvrir le dossier du cache
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
