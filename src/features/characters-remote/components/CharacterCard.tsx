import { motion } from "framer-motion";
import { Download, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { charactersRemoteService } from "@/features/characters-remote/charactersRemote.service";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

interface CharacterCardProps {
  url: string;
  name: string;
  owner: string;
  downloads: number;
  likes: number;
  characterid: string;
  dnaurl: string;
  index: number;
}

export function CharacterCard({
  url,
  name,
  owner,
  downloads,
  likes,
  characterid,
  dnaurl,
  index,
}: CharacterCardProps) {
  const { toast } = useToast();
  const batchIndex = index % 12;

  const openExternalLink = async () => {
    await openExternalUrl(
      `https://www.star-citizen-characters.com/character/${characterid}`,
    );
  };

  const handleDownload = async () => {
    try {
      const res = await charactersRemoteService.download(dnaurl, name);
      if (res) {
        toastSuccess(toast, "Preset téléchargé");
      }
    } catch (error) {
      toastError(toast, "Téléchargement impossible", toFriendlyFsError(error));
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.06 * batchIndex,
        ease: [0, 0.71, 0.2, 1.01],
      }}
      className="settings-section group relative flex h-[400px] w-full max-w-md flex-col overflow-hidden"
      data-no-window-drag
    >
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img
          src={url}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-background/15" />
      </div>

      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 border border-primary/15 bg-background/30 backdrop-blur-md hover:bg-background/45"
          title="Voir sur SC Characters"
          data-no-window-drag
          onClick={(e) => {
            e.stopPropagation();
            openExternalLink();
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-primary/15 bg-background/30 px-2 text-xs backdrop-blur-md">
            <Download className="h-3.5 w-3.5" />
            {downloads}
          </span>
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-primary/15 bg-background/30 px-2 text-xs backdrop-blur-md">
            <Heart className="h-3.5 w-3.5" />
            {likes}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-end px-3 pb-3">
        <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">
          {name}
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          Créateur : <span className="text-foreground">{owner}</span>
        </p>

        <Button
          type="button"
          className="mt-3 w-full"
          data-no-window-drag
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </Button>
      </div>
    </motion.article>
  );
}
