import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionInfo {
    version: string;
    path: string;
}

interface PresetActionModalProps {
    open: boolean;
    onClose: () => void;
    characterName: string;
    versions: VersionInfo[];
    action: "delete" | "open";
    onConfirm: (selectedVersions: VersionInfo[]) => void;
}

export function PresetActionModal({
    open,
    onClose,
    characterName,
    versions,
    action,
    onConfirm,
}: PresetActionModalProps) {
    const [selected, setSelected] = useState<string[]>([]);

    // Reset la sélection à chaque ouverture/fermeture de la modal
    useEffect(() => {
        setSelected([]);
    }, [open]);

    const handleToggle = (version: string) => {
        setSelected((prev) =>
            prev.includes(version)
                ? prev.filter((v) => v !== version)
                : [...prev, version]
        );
    };

    const handleConfirm = () => {
        const selectedVersions = versions.filter((v) => selected.includes(v.version));
        onConfirm(selectedVersions);
        onClose();
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="settings-section border-primary/12 bg-background/40 backdrop-blur-xl" data-no-window-drag>
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">
                        {action === "delete"
                            ? `Supprimer « ${characterName} »`
                            : `Ouvrir « ${characterName} »`}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-1">
                    {versions.map((v) => (
                        <label
                            key={v.version}
                            className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm",
                                v.path
                                    ? "border-primary/12 bg-primary/5"
                                    : "cursor-not-allowed border-primary/6 opacity-60",
                            )}
                            data-no-window-drag
                        >
                            <Checkbox
                                checked={selected.includes(v.version)}
                                onCheckedChange={() => handleToggle(v.version)}
                                disabled={!v.path}
                            />
                            {v.path ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="font-medium">{v.version}</span>
                            {!v.path && (
                                <span className="text-xs text-muted-foreground">(absent)</span>
                            )}
                        </label>
                    ))}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} data-no-window-drag>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selected.length === 0}
                        variant={action === "delete" ? "destructive" : "default"}
                        data-no-window-drag
                    >
                        {action === "delete" ? "Supprimer" : "Ouvrir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
