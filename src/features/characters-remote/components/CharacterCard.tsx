import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { charactersRemoteService } from "@/features/characters-remote/charactersRemote.service";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";
import logger from "@/utils/logger";
import { IconDownload, IconExternalLink, IconHeart } from "@tabler/icons-react";

interface CharacterCardProps {
  url: string;
  name: string;
  owner: string;
  downloads: number;
  likes: number;
  characterid: string;
  dnaurl: string;
}

export function CharacterCard({
  url,
  name,
  owner,
  downloads,
  likes,
  characterid,
  dnaurl,
}: CharacterCardProps) {
  const { toast } = useToast();

  const openExternalLink = async (id: string) => {
    logger.log("Opening external link for character ID:", id);
    await openExternalUrl(
      `https://www.star-citizen-characters.com/character/${id}`,
    );
  };

  const handleDownload = async () => {
    try {
      const res = await charactersRemoteService.download(dnaurl, name);
      if (res) {
        toastSuccess(
          toast,
          "Preset téléchargé",
          "Le preset a été ajouté dans vos versions.",
        );
      }
    } catch (error) {
      toastError(toast, "Erreur", toFriendlyFsError(error));
    }
  };

  return (
    <Card className="grid grid-rows-12 group h-[400px] relative max-w-md shadow-none bg-background/30 border-background/20 overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      </div>
      <CardHeader className="flex flex-row justify-between items-center row-span-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            openExternalLink(characterid);
          }}
          className="flex items-center justify-center h-7 w-7 rounded-md bg-white/10 backdrop-blur-md text-white transition-all duration-300 hover:bg-white/20 shrink-0 -mb-1"
          title="Voir sur SC Characters"
        >
          <IconExternalLink className="h-3.5 w-3.5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center gap-1 bg-white/10 backdrop-blur-md rounded-md px-2 h-7 shrink-0">
            <IconDownload className="h-3.5 w-3.5" />
            <span className="text-xs leading-none">{downloads}</span>
          </div>
          <div className="flex items-center justify-center gap-1 bg-white/10 backdrop-blur-md rounded-md px-2 h-7 shrink-0">
            <IconHeart className="h-3.5 w-3.5" />
            <span className="text-xs leading-none">{likes}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="row-span-8 flex justify-end flex-col w-full">
        <CardTitle className="text-2xl line-clamp-1">{name}</CardTitle>
        <CardDescription>
          <p>
            Créateur :{" "}
            <span className="text-foreground truncate">{owner}</span>
          </p>
        </CardDescription>
      </CardContent>
      <CardFooter className="row-span-2">
        <Button className="w-full" onClick={handleDownload}>
          <IconDownload className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </CardFooter>
    </Card>
  );
}
