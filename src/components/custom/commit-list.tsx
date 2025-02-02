import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Commit } from "@/types/commit";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleHelp } from "lucide-react";

const CommitsList = () => {
    const [commits, setCommits] = useState<Commit[]>([]);
    
    async function fetchCommits() {
        try {
            const response = await invoke("get_latest_commits", {
                owner: "Onivoid",
                repo: "MultitoolV2",
            });
            setCommits(response as any);
            console.log("Commits fetched:", response);
        } catch (error) {
            console.error("Error fetching commits:", error);
        }
    }

    useEffect(() => {
        fetchCommits();
    }, []);

    return (
        <div>
            <div className="flex items-center gap-2">
                <h3 className="text-2xl text-primary font-bold">Patchnotes</h3>
                <Dialog>
                    <DialogTrigger asChild>
                        <CircleHelp className="h-5 w-5 hover:cursor-pointer" />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <h2 className="text-primary font-bold text-lg">
                                Comment lire les Patchnotes ?
                            </h2>
                        </DialogHeader>
                        <ul className="pl-3">
                            <li>
                                <span className="text-primary">- Feat</span> :
                                Nouvelle fonctionnalité
                            </li>
                            <li>
                                <span className="text-primary">- Bugfix</span> :
                                Correction de bug
                            </li>
                            <li>
                                <span className="text-primary">
                                    - Refactoring
                                </span>{" "}
                                : Modification de code
                            </li>
                            <li>
                                <span className="text-primary">- Release</span>{" "}
                                : Nouvelle version
                            </li>
                        </ul>
                    </DialogContent>
                </Dialog>
            </div>
            <Separator className="my-2" />
            {!commits[0] ? (
                <Skeleton className="h-[430px]" />
            ) : (
                <ul className="overflow-y-scroll h-[430px] bg-zinc-900 p-5 rounded-xl">
                    {commits.map((commit, index) => (
                        <li key={index}>
                            <p className="text-lg font-bold text-zinc-200">
                                {commit.message}
                            </p>
                            <p className="text-xs text-zinc-600 mb-2">
                                {commit.date}
                            </p>
                            <ul className="text-sm text-zinc-500">
                                {commit.description
                                    ?.split("\n")
                                    .map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                            </ul>
                            <Separator className="my-5" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CommitsList;
