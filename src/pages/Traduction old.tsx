"use client";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    GamePaths,
    isGamePaths,
    LocalizationConfig,
    isLocalizationConfig,
    Link,
    TranslationsChoosen,
} from "@/types/translation";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
                const translations = await invoke("get_translations");
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    duration: 1,
                    delay: 0.4 + index * 0.2,
                    ease: [0, 0.71, 0.2, 1.01],
                }}
                className="flex flex-col"
            >
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            </span>
                            {key}
                        </CardTitle>
                        <p className="text-xs text-gray-600">{value.path}</p>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold mb-2">
                            Traduction à installer :
                        </p>
                        <Select
                            value={
                                translationsSelected[
                                    key as keyof TranslationsChoosen
                                ] || ""
                            }
                            onValueChange={(value) =>
                                translationsSelectorHandler(key, value)
                            }
                        >
                            <SelectTrigger className="w-[70%]">
                                <SelectValue placeholder="Sélectionner la traduction" />
                            </SelectTrigger>
                            <SelectContent>
                                {translations &&
                                    translations[defaultLanguage].links.map(
                                        (link: Link) => (
                                            <SelectItem
                                                key={link.id}
                                                value={link.url}
                                            >
                                                {link.name}
                                            </SelectItem>
                                        ),
                                    )}
                            </SelectContent>
                        </Select>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-3">
                        {value.translated ? (
                            <Button
                                variant={"destructive"}
                                onClick={() =>
                                    handleUninstallTranslation(value.path)
                                }
                            >
                                Désinstaller
                            </Button>
                        ) : (
                            <Button
                                className="flex items-center justify-center gap-1"
                                disabled={
                                    translationsSelected[
                                        key as keyof TranslationsChoosen
                                    ] === null || loadingButtonId === key
                                }
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
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Installation en cours...
                                    </>
                                ) : (
                                    "Installer la traduction"
                                )}
                            </Button>
                        )}
                        {value.translated && !value.up_to_date ? (
                            <Button
                                variant={"secondary"}
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
                                {loadingButtonId === key
                                    ? "Mise à jour en cours..."
                                    : "Mettre à jour"}
                            </Button>
                        ) : null}
                    </CardFooter>
                </Card>
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
                    className="grid w-full max-w-full 
            auto-cols-max auto-rows-min grid-cols-2 xl:grid-cols-3
            gap-4 mt-5 overflow-y-scroll overflow-x-hidden pr-3 pb-3"
                >
                    {renderCard}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center w-full h-screen">
                    <h2 className="text-3xl font-bold text-primary mb-2">
                        Aucune versions du jeu n{"'"}a était trouvée
                    </h2>
                    <p className="max-w-[500px] text-center leading-7">
                        Pour régler ce problème, lancez StarCitizen, puis
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