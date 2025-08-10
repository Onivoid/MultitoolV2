import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Lens } from "@/components/magicui/lens";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "@/hooks/use-toast";
import logger from "@/utils/logger";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import openExternal from "@/utils/external";

export function CharacterCard(
    { url, name, owner, downloads, likes, characterid, dnaurl }:
        { url: string, name: string, owner: string, downloads: number, likes: number, characterid: string, dnaurl: string }
) {
    const { toast } = useToast();

    const openExternalLink = async (id: string) => {
        logger.log("Opening external link for character ID:", id);
        await openExternal(`https://www.star-citizen-characters.com/character/${id}`);
    };

    const handleDownload = async () => {
        try {
            const res = await invoke("download_character", { dnaUrl: dnaurl, title: name });
            if (res) {
                toast({
                    title: "Preset téléchargé",
                    description: "Le preset a été ajouté dans vos versions.",
                    variant: "success",
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: toFriendlyFsError(error),
                variant: "destructive",
                duration: 4000,
            });
        }
    };

    return (
        <Card className="relative max-w-md shadow-none bg-background/30 border-background/20">
            <CardHeader>
                <Lens
                    zoomFactor={1.3}
                    lensSize={100}
                    isStatic={false}
                    ariaLabel="Zoom Area"
                >
                    <img
                        src={url}
                        alt="image placeholder"
                    />
                </Lens>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-2xl truncate">{name}</CardTitle>
                <CardDescription>
                    <p>Créateur : <span className="text-foreground truncate">{owner}</span></p>
                    <p>Nombre de téléchargement : <span className="text-foreground">{downloads}</span></p>
                    <p>Nombre de Like : <span className="text-foreground">{likes}</span></p>
                    <p>Source :
                        <a className="cursor-pointer text-blue-500 ml-1" onClick={() => openExternalLink(characterid)}>
                            StarCitizenCharacters
                        </a>
                    </p>
                </CardDescription>
            </CardContent>
            <CardFooter className="space-x-4">
                <Button onClick={handleDownload}>Télécharger</Button>
            </CardFooter>
        </Card>
    );
}