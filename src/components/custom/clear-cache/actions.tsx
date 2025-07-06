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
    const handleOpenCharactersFolder = async () => {
        try {
            const res = await invoke("open_characters_folder");
            if (res) {
                toast({
                    title: "Dossier ouvert",
                    description: "Le dossier des personnages a bien été ouvert.",
                    success: true,
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: "Erreur lors de l'ouverture",
                description: `Une erreur est survenue : ${error}`,
                success: false,
                duration: 3000,
            });
        }
    };
    const handleDuplicateCharacter = async () => {
        try {
            const res = await invoke("duplicate_character");
            if (res) {
                setCacheInfos([]);
                toast({
                    title: "Preset dupliqué",
                    description: "Le preset a été copié sur toutes les versions.",
                    success: true,
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: "Erreur lors de la duplication",
                description: `Une erreur est survenue : ${error}`,
                success: false,
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
                    onClick={handleDuplicateCharacter}
                >
                    Dupliquer le preset
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="hover:cursor-pointer"
                    onClick={handleOpenCharactersFolder}
                >
                    Ouvrir le dossier des personnages
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
