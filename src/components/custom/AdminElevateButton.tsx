import { Shield } from "lucide-react";
import { useAdminStore } from "@/stores/admin-store";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function AdminElevateButton() {
    const visibleOverride = useAdminStore((s) => s.visible);
    const { toast } = useToast();
    const [hover, setHover] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // Changé à false pour voir le bouton en dev

    useEffect(() => {
        const check = async () => {
            try {
                const res = await invoke<boolean>("is_running_as_admin");
                setIsAdmin(res);
            } catch (error) {
                setIsAdmin(true);
            }
        };
        check();
        const id = setInterval(check, 5000);
        return () => clearInterval(id);
    }, []);

    const shouldShow = !isAdmin || visibleOverride;
    if (!shouldShow) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 w-[200px] h-10 flex items-center justify-end"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <button
                aria-label="Relancer en admin"
                title="Relancer en administrateur"
                onClick={async () => {
                    try {
                        await invoke("restart_as_admin");
                    } catch (e) {
                        toast({
                            title: "Impossible de relancer en admin",
                            description: String(e),
                            success: "false",
                        });
                    }
                }}
                className={`group relative flex items-center rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition-all duration-200 h-10
                ${hover ? "w-[200px] px-3 gap-2 justify-start" : "w-10 gap-0 justify-center"}
                ${(!isAdmin && !hover) ? "admin-pulse" : "shadow-lg"}`}
            >
                <Shield className="h-5 w-5" />
                <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${hover ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                        }`}
                >
                    Relancer en admin
                </span>
            </button>
        </div>
    );
}


