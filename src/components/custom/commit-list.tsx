import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Commit } from "@/types/commit";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
            {!commits[0] ? (
                <Skeleton className="h-[calc(100vh-130px)]" />
            ) : (
                <ul className="overflow-y-scroll h-[calc(100vh-170px)] bg-zinc-900/50 p-5 rounded-xl w-full">
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
