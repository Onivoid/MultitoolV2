"use client";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CacheInfos, columns, Folder } from "@/components/custom/clear-cache/columns";
import { DataTable } from "@/components/custom/clear-cache/data-table";
import ActionsMenu from "@/components/custom/clear-cache/actions";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/custom/PageHeader";
import { BrushCleaning } from "lucide-react";

export default function ClearCache() {
    const [cacheInfos, setCacheInfos] = useState<Folder[] | null>(null);
    const { toast } = useToast();
    const [loadingDot, setLoadingDot] = useState(0);

    const ScanCache = useCallback(async () => {
        const result: CacheInfos = JSON.parse(
            await invoke("get_cache_informations"),
        );
        setCacheInfos(result.folders);
    }, [setCacheInfos]);

    const updateCacheInfos = (path: string) => {
        setCacheInfos(
            (prev) => prev?.filter((folder) => folder.path !== path) || null,
        );
    };

    useEffect(() => {
        if (!cacheInfos) {
            ScanCache();
        }
    }, [cacheInfos, ScanCache]);

    useEffect(() => {
        if (cacheInfos) return;
        const interval = setInterval(() => {
            if (loadingDot === 3) {
                setLoadingDot(0);
            }
            setLoadingDot((prev) => prev + 1);
        }, 500);

        return () => clearInterval(interval);
    }, [cacheInfos, loadingDot]);

    return cacheInfos ? (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex flex-col w-full max-h-[calc(100vh-50px)]"
        >
            <div className="flex items-center justify-between">
                <PageHeader
                    icon={<BrushCleaning className="h-6 w-6" />}
                    title="Gestionnaire du cache"
                    description="Gérez et nettoyez les fichiers en cache de Star Citizen"
                />
                <ActionsMenu setCacheInfos={setCacheInfos} />
            </div>

            <DataTable
                columns={columns(toast, updateCacheInfos)}
                data={cacheInfos}
            />
        </motion.div>
    ) : (
        <div className="flex h-screen w-full flex-row gap-3 items-center justify-center">
            <p>
                Récupération des données{" "}
                {Array.from({ length: loadingDot }).map(() => ".")}
            </p>
        </div>
    );
}
