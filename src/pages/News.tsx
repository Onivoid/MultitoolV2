import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Newspaper, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/custom/PageHeader";
import { invoke } from "@tauri-apps/api/core";
import openExternal from "@/utils/external";
import logger from "@/utils/logger";

interface NewsItem {
    id: string;
    url: string;
    tags: string[];
    summary: string;
    content_html: string;
    date_published: string;
}

interface JsonFeed {
    items: NewsItem[];
}

function extractThumbnail(html: string, tags: string[]): { url: string | null; isVideo: boolean } {
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return { url: imgMatch[1], isVideo: false };

    const ytMatch = html.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    if (ytMatch) return { url: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`, isVideo: true };

    const isVideo = tags.some((t) => t.toLowerCase() === "video");
    return { url: null, isVideo };
}

function formatDate(dateStr: string): string {
    try {
        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function extractTitle(url: string): string {
    const parts = url.split("/");
    const slug = parts[parts.length - 1] || "";
    return slug
        .replace(/^\d+-/, "")
        .replace(/-/g, " ");
}

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { toast } = useToast();

    const fetchNews = useCallback(
        async (silent = false) => {
            try {
                const raw = await invoke<string>("fetch_rsi_news");
                const data: JsonFeed = JSON.parse(raw);
                setNews(data.items || []);
                if (!silent) {
                    toast({
                        title: "News mises à jour",
                        description: `${data.items?.length || 0} articles chargés`,
                        variant: "success",
                    });
                }
            } catch (error) {
                logger.error("Erreur lors du chargement des news:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les news Star Citizen",
                    variant: "destructive",
                });
            }
        },
        [toast],
    );

    useEffect(() => {
        setIsLoading(true);
        fetchNews(true).finally(() => setIsLoading(false));
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNews(false);
        setIsRefreshing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex max-h-[calc(100vh-50px)] w-full flex-1 flex-col"
        >
            <div className="flex shrink-0 items-center justify-between pr-3">
                <PageHeader
                    icon={<Newspaper className="h-6 w-6" />}
                    title="News Star Citizen"
                    description="Dernières actualités officielles de Roberts Space Industries"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="shrink-0"
                >
                    <RefreshCw
                        className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Rafraîchir
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : news.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                    Aucune news disponible
                </div>
            ) : (
                <div className="app-scroll-root min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-4 pr-3">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {news.map((item) => {
                            const { url: thumbUrl, isVideo } = extractThumbnail(item.content_html, item.tags);
                            const title = extractTitle(item.url);

                            const handleOpen = () => {
                                openExternal(item.url);
                            };

                            return (
                                <Card
                                    key={item.id}
                                    className="flex h-[340px] flex-col overflow-hidden bg-background/40 cursor-pointer transition-colors hover:bg-background/60 group"
                                    onClickCapture={handleOpen}
                                    role="link"
                                >
                                    <div className="relative h-40 w-full shrink-0 overflow-hidden pointer-events-none">
                                        {thumbUrl ? (
                                            <img
                                                src={thumbUrl}
                                                alt={title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                                {isVideo ? (
                                                    <Play className="h-10 w-10 text-muted-foreground" />
                                                ) : (
                                                    <Newspaper className="h-10 w-10 text-muted-foreground/50" />
                                                )}
                                            </div>
                                        )}
                                        {isVideo && thumbUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Play className="h-10 w-10 text-white/90 fill-white/90" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="flex min-h-0 flex-1 flex-col pointer-events-none p-4 pt-3">
                                        <div className="mb-2 flex shrink-0 items-center gap-2">
                                            {item.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                                {formatDate(item.date_published)}
                                            </span>
                                        </div>
                                        <h3 className="mb-2 line-clamp-2 shrink-0 text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                                            {title}
                                        </h3>
                                        <p className="line-clamp-3 flex-1 text-xs text-muted-foreground">
                                            {item.summary || "\u00A0"}
                                        </p>
                                        <div className="mt-auto flex shrink-0 items-center gap-1 pt-2 text-xs text-primary">
                                            <ExternalLink className="h-3 w-3" />
                                            Ouvrir sur RSI
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
