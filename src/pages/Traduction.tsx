import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    GamePaths,
    isGamePaths,
    TranslationOption,
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
    const [translations, setTranslations] = useState<TranslationOption[] | null>(null);
    const [translationsSelected, setTranslationsSelected] = useState<TranslationsChoosen | null>(null);
    const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
    const [dataFetched, setDataFetched] = useState<boolean>(false);

    const defaultLanguage = "fr";
    const { toast } = useToast();

    const getDefaultTranslationsState = (): TranslationsChoosen => {
        if (!paths) return {};
        
        const defaults: TranslationsChoosen = {};
        
        Object.keys(paths.versions).forEach(version => {
            defaults[version] = { link: null, settingsEN: false };
        });
        
        return defaults;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (dataFetched) return;
            try {
                const versions = await invoke("get_star_citizen_versions");
                if (isGamePaths(versions)) {
                    console.log("Versions du jeu reçues:", versions);
                    setPaths(versions);
                }

                console.log("Récupération des traductions...");
                const translationsData = await invoke("get_translations");
                console.log("Données de traduction reçues:", translationsData);

                if (Array.isArray(translationsData)) {
                    setTranslations(translationsData as TranslationOption[]);
                } else {
                    console.warn("Format inattendu pour les données de traduction:", translationsData);
                }

                const savedPrefs: TranslationsChoosen = await invoke("load_translations_selected");
                if (savedPrefs && typeof savedPrefs === "object") {
                    console.log("Préférences de traduction chargées:", savedPrefs);
                    setTranslationsSelected(savedPrefs);
                } else {
                    console.log("Initialisation avec les préférences par défaut");
                    setTranslationsSelected(getDefaultTranslationsState());
                }

                return true;
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
                setTranslationsSelected(getDefaultTranslationsState());
                return false;
            }
        };

        if (!dataFetched) {
            setDataFetched(true);
            fetchData().then((status) => {
                status
                    ? toast({
                        title: "Données chargées",
                        description: "Les données de traduction ont été chargées avec succès.",
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
        }
    }, []);

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
            if (!translationsSelected) return;

            const updatedPaths = { ...paths };
            await Promise.all(
                Object.entries(paths.versions).map(async ([key, value]) => {
                    const versionSettings = translationsSelected[key as keyof TranslationsChoosen];

                    const translated: boolean = await invoke(
                        "is_game_translated",
                        {
                            path: value.path,
                            lang: defaultLanguage,
                        },
                    );

                    const upToDate: boolean = (versionSettings && versionSettings.link)
                        ? await invoke("is_translation_up_to_date", {
                            path: value.path,
                            translationLink: versionSettings.link,
                            lang: defaultLanguage,
                        })
                        : value.up_to_date;

                    const versionInfo = {
                        path: value.path,
                        translated: translated,
                        up_to_date: upToDate,
                    };

                    updatedPaths.versions[key as keyof GamePaths["versions"]] = versionInfo;
                }),
            );

            setPaths(updatedPaths);
            setLoadingButtonId(null);
        },
        [translationsSelected, defaultLanguage],
    );

    const handleInstallTranslation = useCallback(
        async (versionPath: string, version: string) => {
            console.log("Installation de la traduction pour la version:", version);
            if (!translationsSelected) return;

            setLoadingButtonId(version);

            const versionSettings = translationsSelected[version as keyof TranslationsChoosen];
            if (!versionSettings || !versionSettings.link) {
                console.log("Récupération de la traduction settings-fr...");
                try {
                    const translationData = await invoke("get_translation_by_setting", { settingType: "settings-fr" });
                    console.log("Données reçues:", translationData);

                    let link = null;

                    if (typeof translationData === 'string') {
                        link = translationData;
                    }
                    else if (typeof translationData === 'object' && translationData !== null) {
                        if ('link' in translationData) {
                            link = translationData.link;
                        }
                        else if (Array.isArray(translationData) && translationData.length > 0) {
                            for (const item of translationData) {
                                if (typeof item === 'object' && item !== null && 'link' in item) {
                                    link = item.link;
                                    break;
                                }
                            }
                        }
                    }

                    console.log("Lien extrait:", link);

                    if (link) {
                        const updatedTranslations = {
                            ...translationsSelected,
                            [version]: {
                                link: link,
                                settingsEN: false,
                            },
                        };

                        setTranslationsSelected(updatedTranslations);
                        saveSelectedTranslations(updatedTranslations);

                        console.log("Installation avec lien:", link);
                        await invoke("init_translation_files", {
                            path: versionPath,
                            translationLink: link,
                            lang: defaultLanguage,
                        });

                        toast({
                            title: "Traduction installée",
                            description: "La traduction a été installée avec succès.",
                            success: true,
                            duration: 3000,
                        });

                        if (paths) CheckTranslationsState(paths);
                    } else {
                        toast({
                            title: "Erreur d'installation",
                            description: "Impossible de récupérer le lien de traduction.",
                            success: false,
                            duration: 3000,
                        });
                        setLoadingButtonId(null);
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération du lien:", error);
                    toast({
                        title: "Erreur d'installation",
                        description: `Erreur: ${error}`,
                        success: false,
                        duration: 3000,
                    });
                    setLoadingButtonId(null);
                }
            } else {
                try {
                    console.log("Installation avec le lien existant:", versionSettings.link);

                    await invoke("init_translation_files", {
                        path: versionPath,
                        translationLink: versionSettings.link,
                        lang: defaultLanguage,
                    });

                    toast({
                        title: "Traduction installée",
                        description: "La traduction a été installée avec succès.",
                        success: true,
                        duration: 3000,
                    });

                    if (paths) CheckTranslationsState(paths);
                } catch (error) {
                    console.error("Erreur d'installation:", error);
                    toast({
                        title: "Erreur d'installation",
                        description: `Erreur: ${error}`,
                        success: false,
                        duration: 3000,
                    });
                    setLoadingButtonId(null);
                }
            }
        },
        [toast, paths, CheckTranslationsState, translationsSelected, saveSelectedTranslations, defaultLanguage],
    );

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
                if (paths) CheckTranslationsState(paths);
            });
        },
        [toast, paths, CheckTranslationsState],
    );

    const handleSettingsToggle = useCallback(
        async (version: string, settingsEN: boolean) => {
            if (!translationsSelected) return;

            const settingType = settingsEN ? "settings-en" : "settings-fr";
            console.log(`Récupération de la traduction pour ${settingType}...`);

            try {
                setLoadingButtonId(`switch-${version}`);

                const translationData = await invoke("get_translation_by_setting", { settingType });
                console.log("Données reçues:", translationData);

                let link = null;

                if (typeof translationData === 'string') {
                    link = translationData;
                }
                else if (typeof translationData === 'object' && translationData !== null) {
                    if ('link' in translationData) {
                        link = translationData.link;
                    }
                    else if (Array.isArray(translationData) && translationData.length > 0) {
                        for (const item of translationData) {
                            if (typeof item === 'object' && item !== null && 'link' in item) {
                                link = item.link;
                                break;
                            }
                        }
                    }
                }

                console.log("Lien extrait:", link);

                if (link) {
                    const updatedTranslations = {
                        ...translationsSelected,
                        [version]: {
                            ...translationsSelected[version as keyof TranslationsChoosen],
                            link: link,
                            settingsEN: settingsEN,
                        },
                    };

                    setTranslationsSelected(updatedTranslations);
                    await saveSelectedTranslations(updatedTranslations);

                    const versionPath = paths?.versions[version as keyof GamePaths["versions"]]?.path;
                    if (versionPath && paths?.versions[version as keyof GamePaths["versions"]]?.translated) {
                        const isUpToDate = await invoke("is_translation_up_to_date", {
                            path: versionPath,
                            translationLink: link,
                            lang: defaultLanguage,
                        });

                        if (paths) {
                            const updatedPaths = { ...paths };
                            const currentVersion = updatedPaths.versions[version as keyof GamePaths["versions"]];
                            if (currentVersion) {
                                updatedPaths.versions[version as keyof GamePaths["versions"]] = {
                                    ...currentVersion,
                                    up_to_date: isUpToDate as boolean
                                };
                                setPaths(updatedPaths);
                            }
                        }

                        if (!isUpToDate) {
                            toast({
                                title: "Traduction obsolète",
                                description: "La traduction doit être mise à jour pour correspondre à cette configuration.",
                                success: false,
                                duration: 5000,
                            });
                        } else {
                            toast({
                                title: "Paramètres modifiés",
                                description: "Vous pouvez mettre à jour la traduction pour appliquer les nouveaux paramètres.",
                                success: true,
                                duration: 5000,
                            });
                        }
                    }
                } else {
                    toast({
                        title: "Erreur de configuration",
                        description: "Impossible de récupérer les informations de traduction.",
                        success: false,
                        duration: 3000,
                    });
                }

                setLoadingButtonId(null);
            } catch (error) {
                console.error("Erreur lors du changement de paramètres:", error);
                toast({
                    title: "Erreur de configuration",
                    description: `Une erreur est survenue: ${error}`,
                    success: false,
                    duration: 3000,
                });
                setLoadingButtonId(null);
            }
        },
        [translationsSelected, paths, saveSelectedTranslations, handleUpdateTranslation, toast, defaultLanguage],
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
    }, [paths]);

    useEffect(() => {
        if (translationsSelected && paths) {
            CheckTranslationsState(paths);
        }
    }, [translationsSelected]);


    const handleUninstallTranslation = useCallback(
        async (versionPath: string) => {
            invoke("uninstall_translation", { path: versionPath }).then(() => {
                toast({
                    title: "Traduction désinstallée",
                    description: "La traduction a été désinstallée avec succès.",
                    success: true,
                    duration: 3000,
                });
                if (paths) CheckTranslationsState(paths);
            });
        },
        [toast, paths, CheckTranslationsState],
    );

    const renderCard = useMemo(() => {
        if (!paths || !translationsSelected) return null;

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
                <div className="w-full rounded-lg border border-primary/50 bg-card/50 hover:bg-card/60 shadow-sm p-2 duration-150 ease-in-out">
                    <div className="grid grid-cols-12 gap-2">
                        {/* Nom */}
                        <div className="flex justify-start items-center col-span-2">
                            <p className="font-medium text-sm">
                                {key}
                            </p>
                        </div>

                        {/* Chemin */}
                        <div className="flex justify-start items-center col-span-2 truncate">
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
                        <div className="flex justify-center items-center gap-2 col-span-2">
                            <span className="text-sm">FR</span>
                            {loadingButtonId === `switch-${key}` ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Switch
                                    checked={translationsSelected[key as keyof TranslationsChoosen]?.settingsEN === true}
                                    onCheckedChange={(checked) => handleSettingsToggle(key, checked)}
                                    disabled={loadingButtonId !== null}
                                />
                            )}
                            <span className="text-sm">EN</span>
                        </div>

                        {/* État de la traduction */}
                        <div className="flex items-center justify-start col-span-2">
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
                        <div className="flex justify-end items-center col-span-4">
                            {!value.translated && (
                                <Button
                                    size="sm"
                                    disabled={loadingButtonId === key}
                                    onClick={() => handleInstallTranslation(value.path, key)}
                                >
                                    {loadingButtonId === key ? (
                                        <>
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                            Installation...
                                        </>
                                    ) : (
                                        "Installer"
                                    )}
                                </Button>
                            )}
                            {value.translated && !value.up_to_date && translationsSelected[key as keyof TranslationsChoosen]?.link && (
                                <Button
                                    variant={"secondary"}
                                    size="sm"
                                    disabled={loadingButtonId === key}
                                    onClick={() =>
                                        handleUpdateTranslation(
                                            value.path,
                                            translationsSelected[key as keyof TranslationsChoosen]!.link!,
                                            key
                                        )
                                    }
                                >
                                    {loadingButtonId === key ? (
                                        <>
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        "Mettre à jour"
                                    )}
                                </Button>
                            )}
                            {value.translated && (
                                <Button
                                    variant={"destructive"}
                                    size="sm"
                                    disabled={loadingButtonId === key}
                                    onClick={() => handleUninstallTranslation(value.path)}
                                >
                                    {loadingButtonId === key ? (
                                        <>
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
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
    }, [
        paths,
        translationsSelected,
        loadingButtonId,
        handleSettingsToggle,
        handleInstallTranslation,
        handleUpdateTranslation,
        handleUninstallTranslation
    ]);

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
                    <div className="grid grid-cols-12 pr-4 gap-5">
                        <p className="col-span-2 font-bold">
                            Version
                        </p>
                        <p className="col-span-2 text-center font-bold">
                            Chemin
                        </p>
                        <p className="col-span-2 text-center font-bold">
                            Settings
                        </p>
                        <p className="col-span-2 text-center font-bold">
                            État
                        </p>
                        <p className="col-span-4 text-end font-bold">
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
