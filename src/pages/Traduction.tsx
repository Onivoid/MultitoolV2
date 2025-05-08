import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    GamePaths,
    isGamePaths,
    LocalizationConfig,
    isLocalizationConfig,
    TranslationsChoosen,
} from "@/types/translation";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Traduction() {
    const [paths, setPaths] = useState<GamePaths | null>();
    const [earlyChecked, setEarlyChecked] = useState<boolean>(false);
    const [translations, setTranslations] =
        useState<LocalizationConfig | null>();
    const [translationsSelected, setTranslationsSelected] = useState<any>({});
    const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
    const [dataFetched, setDataFetched] = useState<boolean>(false);

    const defaultLanguage = "fr";

    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (dataFetched) return;
            try {
                const versions = await invoke("get_star_citizen_versions");
                if (isGamePaths(versions)) {
                    setPaths(versions);
                }
                const translations = await invoke("get_translations");;
                if (isLocalizationConfig(translations)) {
                    setTranslations(translations);
                }
                const data: TranslationsChoosen = await invoke(
                    "load_translations_selected",
                );
                if (data && typeof data === "object") {
                    setTranslationsSelected(data);
                } else {
                    setTranslationsSelected({
                        LIVE: null,
                        PTU: null,
                        EPTU: null,
                        "TECH-PREVIEW": null,
                        "4.0_PREVIEW": null,
                        "HOTFIX": null,
                    });
                }
                return true;
            } catch (error) {
                setTranslationsSelected({
                    LIVE: null,
                    PTU: null,
                    EPTU: null,
                    "TECH-PREVIEW": null,
                    "4.0_PREVIEW": null,
                    "HOTFIX": null,
                });
                return false;
            }
        };
        if (!paths && !translations) {
            setDataFetched(true);
            fetchData().then((status) => {
                status
                    ? toast({
                        title: "Données chargées",
                        description:
                            "Les données de traduction ont été chargées avec succès.",
                        success: true,
                        duration: 3000,
                    })
                    : toast({
                        title: "Erreur lors du chargement des données",
                        description: `Une erreur est survenue lors du chargement des données.`,
                        success: false,
                        duration: 3000,
                    });
            });
        } else return;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paths, translations]);

    const saveSelectedTranslations = useCallback(
        async (newTranslationsSelected: TranslationsChoosen) => {
            try {
                await invoke("save_translations_selected", {
                    data: newTranslationsSelected,
                });
                toast({
                    title: "Préférences de traduction sauvegardées",
                    description: `Les préférences de traduction ont été sauvegardées avec succès.`,
                    success: true,
                    duration: 3000,
                });
            } catch (error) {
                toast({
                    title: "Erreur lors de la sauvegarde des données",
                    description: `Une erreur est survenue lors de la sauvegarde des données : ${error}`,
                    success: false,
                    duration: 3000,
                });
            }
        },
        [toast],
    );

    const CheckTranslationsState = useCallback(
        async (paths: GamePaths) => {
            const updatedPaths = { ...paths };
            await Promise.all(
                Object.entries(paths.versions).map(async ([key, value]) => {
                    const translated: boolean = await invoke(
                        "is_game_translated",
                        {
                            path: value.path,
                            lang: defaultLanguage,
                        },
                    );
                    const upToDate: boolean =
                        translationsSelected[
                            key as keyof TranslationsChoosen
                        ] !== null
                            ? await invoke("is_translation_up_to_date", {
                                  path: value.path,
                                  translationLink:
                                      translationsSelected[
                                          key as keyof TranslationsChoosen
                                      ],
                                  lang: defaultLanguage,
                              })
                            : value.up_to_date;

                    const versionInfo = {
                        path: value.path,
                        translated: translated,
                        up_to_date: upToDate,
                    };
                    updatedPaths.versions[key as keyof GamePaths["versions"]] =
                        versionInfo;
                }),
            );
            setPaths(updatedPaths);
            setLoadingButtonId(null);
        },
        [translationsSelected, defaultLanguage],
    );

    const translationsSelectorHandler = useCallback(
        (version: string, link: string) => {
            const data = {
                ...translationsSelected,
                [version]: link,
            };
            setTranslationsSelected(data);
            saveSelectedTranslations(data);
        },
        [translationsSelected],
    );

    useEffect(() => {
        const checkState = async () => {
            if (!paths) return;
            await CheckTranslationsState(paths);
            setEarlyChecked(true);
        };

        if (!earlyChecked) checkState();

        const interval = setInterval(() => {
            if (paths) {
                CheckTranslationsState(paths);
            }
        }, 60000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paths]);

    useEffect(() => {
        if (translationsSelected && paths) {
            CheckTranslationsState(paths);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [translationsSelected]);

    const handleUpdateTranslation = useCallback(
        async (
            versionPath: string,
            translationLink: string,
            buttonId: string,
        ) => {
            setLoadingButtonId(buttonId);
            invoke("update_translation", {
                path: versionPath,
                translationLink: translationLink,
                lang: defaultLanguage,
            }).then(() => {
                toast({
                    title: "Traduction mise à jour",
                    description: "La traduction a été mise à jour avec succès.",
                    success: true,
                    duration: 3000,
                });
                CheckTranslationsState(paths!);
            });
        },
        [toast, paths, CheckTranslationsState],
    );

    const handleInstallTranslation = useCallback(
        async (
            versionPath: string,
            translationLink: string,
            buttonId: string,
        ) => {
            setLoadingButtonId(buttonId);
            invoke("init_translation_files", {
                path: versionPath,
                translationLink: translationLink,
                lang: defaultLanguage,
            }).then(() => {
                toast({
                    title: "Traduction installée",
                    description: "La traduction a été installée avec succès.",
                    success: true,
                    duration: 3000,
                });
                CheckTranslationsState(paths!);
            });
        },
        [toast, paths, CheckTranslationsState],
    );

    const handleUninstallTranslation = useCallback(
        async (versionPath: string) => {
            invoke("uninstall_translation", { path: versionPath }).then(() => {
                toast({
                    title: "Traduction désinstallée",
                    description:
                        "La traduction a été désinstallée avec succès.",
                    success: true,
                    duration: 3000,
                });
                CheckTranslationsState(paths!);
            });
        },
        [toast, paths, CheckTranslationsState],
    );

    const renderCard = useMemo(() => {
        if (!paths || !translations) return null;
        return Object.entries(paths.versions).map(([key, value], index) => (
            <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
                duration: 0.3, 
                delay: 0.4 + index * 0.2
            }}
            className="w-full"
        >
            <div className="w-full rounded-lg border border-primary/50 bg-card/50 shadow-sm p-2">
                <div className="grid grid-cols-12 gap-5">
                    {/* Nom */}
                    <div className="flex justify-start items-center col-span-2">
                        <p className="font-medium text-sm">
                            {key}
                        </p>
                    </div>
                    
                    {/* Chemin */}
                    <div className="flex justify-start items-center col-span-3 truncate">
                        <Tooltip>
                            <TooltipTrigger className="hover:cursor-default">
                                <p className="text-sm text-muted-foreground">
                                    {value.path}...
                                </p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm text-muted-foreground">
                                    {value.path}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    
                    {/* Switch pour settings FR/EN */}
                    <div className="flex justify-center items-center  gap-2 col-span-2">
                        <span className="text-sm">EN</span>
                        <Switch
                            onCheckedChange={(checked) => {
                                // Logique pour basculer entre settings-en et settings-fr
                                // À implémenter selon votre besoin
                            }}
                        />
                        <span className="text-sm">FR</span>
                    </div>
                    
                    {/* État de la traduction */}
                    <div className="flex items-center justify-start col-span-3">
                        {value.up_to_date ? (
                            <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                À jour
                            </Badge>
                        ) : value.translated ? (
                            <Badge variant="default" className="gap-1">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Obsolète
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1">
                                <XCircle className="h-3.5 w-3.5" />
                                Non installé
                            </Badge>
                        )}
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex justify-end items-center col-span-2">
                        {!value.translated && (
                            <Button
                                size="sm"
                                disabled={loadingButtonId === key}
                                onClick={() =>
                                    handleInstallTranslation(
                                        value.path,
                                        translationsSelected[
                                            key as keyof TranslationsChoosen
                                        ]!,
                                        key as string,
                                    )
                                }
                            >
                                {loadingButtonId === key ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Installation...
                                    </>
                                ) : (
                                    "Installer"
                                )}
                            </Button>
                        )}
                        {value.translated && !value.up_to_date && (
                            <Button
                                variant={"secondary"}
                                size="sm"
                                disabled={loadingButtonId === key}
                                onClick={() =>
                                    handleUpdateTranslation(
                                        value.path,
                                        translationsSelected[
                                            key as keyof TranslationsChoosen
                                        ]!,
                                        key as string,
                                    )
                                }
                            >
                                {loadingButtonId === key ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mise à jour...
                                    </>
                                ) : (
                                    "Mettre à jour"
                                )}
                            </Button>
                        )}
                        {value.translated && value.up_to_date && (
                            <Button
                                variant={"destructive"}
                                size="sm"
                                disabled={loadingButtonId === key}
                                onClick={() =>
                                    handleUninstallTranslation(value.path)
                                }
                            >
                                {loadingButtonId === key ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Désinstallation...
                                    </>
                                ) : (
                                    "Désinstaller"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
        ));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paths, translationsSelected, loadingButtonId]);

    return (
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
            {paths && Object.entries(paths?.versions)[0] ? (
                <div
                    className="w-full max-w-full flex flex-col
            gap-2 mt-5 overflow-y-scroll overflow-x-hidden pr-3 pb-3"
                >
                    <div className="grid grid-cols-12 pr-4">
                        <p className="col-span-2 font-bold">
                            Version
                        </p>
                        <p className="col-span-3 font-bold">
                            Chemin d'installation
                        </p>
                        <p className="col-span-2 text-center font-bold">
                            Settings
                        </p>
                        <p className="col-span-3 font-bold">
                            État de la traduction
                        </p>
                        <p className="col-span-2 text-end font-bold">
                            Action
                        </p>
                    </div>
                    {renderCard}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-screen">
                    <h2 className="text-3xl font-bold mb-2">
                        Aucune version du jeu n{"'"}a été trouvée
                    </h2>
                    <p className="max-w-[500px] text-center leading-7">
                        Pour régler ce problème, lancez Star Citizen, puis
                        rechargez cette page en faisant la manipulation suivante
                        :
                        <span className="bg-gray-500 px-2 py-1 ml-2">
                            CRTL + R
                        </span>
                    </p>
                </div>
            )}
        </motion.div>
    );
}