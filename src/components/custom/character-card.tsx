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

export function CharacterCard(
    { url, name, owner, downloads, likes, characterid } : 
    { url: string, name: string, owner: string, downloads: number, likes: number, characterid: string }
) {

    const openExternalLink = async (id: string) => {
        console.log("Opening external link for character ID:", id);
        await invoke("open_external", { url : `https://www.star-citizen-characters.com/character/${id}` });
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
                <Button>Télécharger</Button>
            </CardFooter>
        </Card>
    );
}