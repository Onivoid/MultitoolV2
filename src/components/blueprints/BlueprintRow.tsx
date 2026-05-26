import { Package } from "lucide-react";
import {
    type BlueprintEntry,
    formatBlueprintDate,
    formatBlueprintOwner,
} from "@/lib/blueprintList";

interface BlueprintRowProps {
    blueprint: BlueprintEntry;
}

export default function BlueprintRow({ blueprint }: BlueprintRowProps) {
    const hasMission =
        Boolean(blueprint.missionDebugName) || Boolean(blueprint.missionTrigger);

    return (
        <article className="flex gap-3 rounded-lg border border-border/60 bg-background/30 px-4 py-3 transition-colors hover:bg-background/50">
            <div className="flex shrink-0 items-start pt-0.5">
                <div className="rounded-full bg-primary/15 p-2">
                    <Package className="h-4 w-4 text-primary" aria-hidden />
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{blueprint.productName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                        {formatBlueprintOwner(blueprint.owner)}
                    </p>
                    {hasMission && (
                        <p className="truncate text-sm text-muted-foreground">
                            {blueprint.missionDebugName}
                            {blueprint.missionTrigger && (
                                <span className="opacity-70">
                                    {" "}
                                    ({blueprint.missionTrigger})
                                </span>
                            )}
                        </p>
                    )}
                </div>

                <div className="shrink-0 text-sm text-muted-foreground sm:text-right">
                    <p className="whitespace-nowrap">{formatBlueprintDate(blueprint.ts)}</p>
                </div>
            </div>
        </article>
    );
}
