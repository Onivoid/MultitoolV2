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
        } catch (error) {
            console.error("Error fetching commits:", error);
        }
    }

    useEffect(() => {
        fetchCommits();
    }, []);

    return (
        <div className="w-full">
            <div className="flex items-center my-3">
                <h3 className="text-2xl font-bold">Patchnotes</h3>
            </div>
            {!commits[0] ? (
                <Skeleton className="h-[430px]" />
            ) : (
                <ul className="overflow-y-scroll h-[430px] bg-zinc-900/50 p-5 rounded-xl w-full">
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
                            <Separator className="my-5 bg-foreground" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CommitsList;
