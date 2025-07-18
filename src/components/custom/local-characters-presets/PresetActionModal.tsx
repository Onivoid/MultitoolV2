import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";

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

export const PresetActionModal: React.FC<PresetActionModalProps> = ({
    open,
    onClose,
    characterName,
    versions,
    action,
    onConfirm,
}) => {
    const [selected, setSelected] = useState<string[]>([]);

    // Reset la sélection à chaque ouverture/fermeture de la modal
    React.useEffect(() => {
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action === "delete"
                            ? `Supprimer le preset "${characterName}"`
                            : `Ouvrir le dossier du preset "${characterName}"`}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 mt-2">
                    {versions.map((v) => (
                        <label key={v.version} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={selected.includes(v.version)}
                                onCheckedChange={() => handleToggle(v.version)}
                                disabled={!v.path}
                            />
                            {v.path ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                            <span>{v.version}</span>
                            {!v.path && (
                                <span className="text-xs text-muted-foreground">(absent)</span>
                            )}
                        </label>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Annuler</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selected.length === 0}
                        variant={action === "delete" ? "destructive" : "default"}
                    >
                        {action === "delete" ? "Supprimer" : "Ouvrir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
