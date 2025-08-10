import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Commit } from "@/types/commit";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function RecentPatchNotes({ max = 3 }: { max?: number }) {
    const [commits, setCommits] = useState<Commit[] | null>(null);

    useEffect(() => {
        const fetchCommits = async () => {
            try {
                const response = await invoke("get_latest_commits", {
                    owner: "Onivoid",
                    repo: "MultitoolV2",
                });
                setCommits(response as any);
            } catch {
                setCommits([]);
            }
        };
        fetchCommits();
    }, []);

    if (commits === null) {
        return <Skeleton className="h-[160px] w-full" />;
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="space-y-3">
                {commits.slice(0, max).map((c, idx) => (
                    <li key={idx} className="text-sm">
                        <p className="font-medium">{c.message}</p>
                        <p className="text-xs text-muted-foreground">{c.date}</p>
                    </li>
                ))}
            </ul>
            <div>
                <Link to="/patchnotes">
                    <Button variant="outline" size="sm">Voir tous les patchnotes</Button>
                </Link>
            </div>
        </div>
    );
}


