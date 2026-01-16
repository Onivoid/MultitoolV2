import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton
} from "@/components/ui/sidebar";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, BrushCleaning, Download, Power, PowerOff, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    IconBrandYoutube, IconHome, IconBrandDiscord,
    IconBrandTwitch, IconCloud, IconBrandGithub,
    IconLanguage, IconUsers
} from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import { ColorPicker } from "@/components/custom/color-picker";
import { useSidebar } from "@/components/ui/sidebar";
import openExternal from "@/utils/external";
import { useEffect, useState } from "react";
import { getBuildInfo, BuildInfo } from "@/utils/buildInfo";

// Menu principal
const menuItems = [
    {
        path: "/",
        icon: <IconHome size={20} />,
        label: "Accueil",
        tooltip: "Accueil"
    },
    {
        path: "/traduction",
        icon: <IconLanguage size={20} />,
        label: "Traduction",
        tooltip: "Traduction"
    },
    {
        path: "/cache",
        icon: <BrushCleaning />,
        label: "Cache",
        tooltip: "Cache"
    },
    {
        path: "/presets-local",
        icon: <IconUsers size={20} />,
        label: "Persos locaux",
        tooltip: "Persos locaux"
    },
    {
        path: "/presets-remote",
        icon: <Download size={20} />,
        label: "Persos en ligne",
        tooltip: "Persos en ligne"
    },
    {
        path: "/updates",
        icon: <Download size={20} />,
        label: "Mises à jour",
        tooltip: "Mises à jour"
    },
    {
        path: "/patchnotes",
        icon: <IconBrandGithub size={20} />,
        label: "Patchnotes",
        tooltip: "Patchnotes"
    }
];

// Liens réseaux sociaux
const socialLinks = [
    {
        href: "https://www.youtube.com/@onivoid",
        icon: <IconBrandYoutube size={20} />,
        label: "Youtube",
        tooltip: "Youtube"
    },
    {
        href: "https://discord.com/invite/aUEEdMdS6j",
        icon: <IconBrandDiscord size={20} />,
        label: "Discord",
        tooltip: "Discord"
    },
    {
        href: "https://www.twitch.tv/onivoid_",
        icon: <IconBrandTwitch size={20} />,
        label: "Twitch",
        tooltip: "Twitch"
    },
    {
        href: "https://github.com/Onivoid",
        icon: <IconBrandGithub size={20} />,
        label: "Github",
        tooltip: "Github"
    }
];

// Services externes
const externalServices = [
    {
        href: "https://discord.com/invite/DccQN8BN2V",
        icon: <IconBrandDiscord size={20} />,
        label: "SCEFRA",
        tooltip: "SCEFRA (Traduction)"
    },
    {
        href: "https://www.star-citizen-characters.com/",
        icon: <IconCloud size={20} />,
        label: "SC Characters",
        tooltip: "SC Characters (Presets)"
    }
];

export function AppSidebar() {
    const { state } = useSidebar();
    const location = useLocation();
    const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

    useEffect(() => {
        getBuildInfo()
            .then(setBuildInfo)
            .catch(() => { });
    }, []);

    const getFilteredMenuItems = () => {
        if (!buildInfo) return menuItems;

        return menuItems.filter(item => {
            if (item.path === "/updates" && buildInfo.distribution === "microsoft-store") {
                return false;
            }
            return true;
        });
    }; const filteredMenuItems = getFilteredMenuItems();
    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent className="overflow-x-hidden">
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Outils
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                {filteredMenuItems.map(item =>
                                    state !== "collapsed" ? (
                                        <Tooltip key={item.path}>
                                            <TooltipTrigger asChild>
                                                <SidebarMenuButton className={`hover:text-primary ${location.pathname === item.path ? 'text-primary' : ''}`} asChild>
                                                    <Link to={item.path}>
                                                        {item.icon}
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{item.tooltip}</TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <SidebarMenuButton key={item.path} className={`hover:text-primary ${location.pathname === item.path ? 'text-primary' : ''}`} asChild>
                                            <Link to={item.path}>
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )
                                )}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {/* Séparateur entre Pages et Réseaux */}
                <div className="px-4"><hr className="border-foreground" /></div>
                {/* Groupe Réseaux */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Réseaux | Onivoid
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                {socialLinks.map(link =>
                                    state !== "collapsed" ? (
                                        <Tooltip key={link.href}>
                                            <TooltipTrigger asChild>
                                                <SidebarMenuButton
                                                    className="hover:text-primary"
                                                    onClick={() => openExternal(link.href)}
                                                >
                                                    {link.icon}
                                                    <span>{link.label}</span>
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{link.tooltip}</TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <SidebarMenuButton
                                            key={link.href}
                                            className="hover:text-primary"
                                            onClick={() => openExternal(link.href)}
                                        >
                                            {link.icon}
                                            <span>{link.label}</span>
                                        </SidebarMenuButton>
                                    )
                                )}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div className="px-4"><hr className="border-foreground" /></div>
                {/* Groupe Services externes */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Services externes
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                {externalServices.map(service =>
                                    state !== "collapsed" ? (
                                        <Tooltip key={service.href}>
                                            <TooltipTrigger asChild>
                                                <SidebarMenuButton
                                                    className="hover:text-primary"
                                                    onClick={() => openExternal(service.href)}
                                                >
                                                    {service.icon}
                                                    <span>{service.label}</span>
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{service.tooltip}</TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <SidebarMenuButton
                                            key={service.href}
                                            className="hover:text-primary"
                                            onClick={() => openExternal(service.href)}
                                        >
                                            {service.icon}
                                            <span>{service.label}</span>
                                        </SidebarMenuButton>
                                    )
                                )}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Dialog>
                            <DialogTrigger className="flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all" asChild>
                                <SidebarMenuButton tooltip={"Paramètres"} className="hover:text-primary">
                                    <Settings />
                                    <span>Paramètres</span>
                                </SidebarMenuButton>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Paramètres</DialogTitle>
                                    <DialogDescription>
                                        Configurez les paramètres de l'application
                                    </DialogDescription>
                                </DialogHeader>
                                <SettingsContent />
                            </DialogContent>
                        </Dialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

interface BackgroundServiceConfig {
    enabled: boolean;
    check_interval_minutes: number;
    language: string;
}

function SettingsContent() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [serviceRunning, setServiceRunning] = useState(false);

    // Configuration du service de fond
    const [config, setConfig] = useState<BackgroundServiceConfig>({
        enabled: false,
        check_interval_minutes: 5,
        language: 'fr',
    });

    // État du démarrage automatique
    const [autoStartupEnabled, setAutoStartupEnabled] = useState(false);
    const [checkingAutoStartup, setCheckingAutoStartup] = useState(true);

    // Charger la configuration au montage
    useEffect(() => {
        loadConfiguration();
        checkAutoStartupStatus();
    }, []);

    const loadConfiguration = async () => {
        try {
            const loadedConfig = await invoke<BackgroundServiceConfig>('load_background_service_config');
            setConfig(loadedConfig);
            setServiceRunning(loadedConfig.enabled);
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
        }
    };

    const checkAutoStartupStatus = async () => {
        try {
            const enabled = await invoke<boolean>('is_auto_startup_enabled');
            setAutoStartupEnabled(enabled);
        } catch (error) {
            console.error('Erreur lors de la vérification du démarrage auto:', error);
        } finally {
            setCheckingAutoStartup(false);
        }
    };

    const handleAutoStartupToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            if (checked) {
                await invoke('enable_auto_startup');
                toast({
                    title: 'Démarrage automatique activé',
                    description: 'L\'application se lancera au démarrage de Windows',
                });
            } else {
                await invoke('disable_auto_startup');
                toast({
                    title: 'Démarrage automatique désactivé',
                    description: 'L\'application ne se lancera plus automatiquement',
                });
            }
            setAutoStartupEnabled(checked);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: `Impossible de ${checked ? 'activer' : 'désactiver'} le démarrage automatique: ${error}`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleServiceToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            const newConfig = { ...config, enabled: checked };

            // Sauvegarder la configuration
            await invoke('save_background_service_config', { config: newConfig });
            await invoke('set_background_service_config', { config: newConfig });

            // Démarrer ou arrêter le service
            if (checked) {
                await invoke('start_background_service');
                toast({
                    title: 'Service démarré',
                    description: 'Le service de mise à jour automatique est maintenant actif',
                });
            } else {
                await invoke('stop_background_service');
                toast({
                    title: 'Service arrêté',
                    description: 'Le service de mise à jour automatique a été arrêté',
                });
            }

            setConfig(newConfig);
            setServiceRunning(checked);
        } catch (error) {
            toast({
                title: 'Erreur',
                description: `Impossible de ${checked ? 'démarrer' : 'arrêter'} le service: ${error}`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleIntervalChange = async (value: number) => {
        if (value < 5) {
            toast({
                title: 'Intervalle invalide',
                description: 'L\'intervalle minimum est de 5 minutes',
                variant: 'destructive',
            });
            setConfig({ ...config, check_interval_minutes: 5 });
            return;
        }

        const newConfig = { ...config, check_interval_minutes: value };
        setConfig(newConfig);

        try {
            await invoke('save_background_service_config', { config: newConfig });
            await invoke('set_background_service_config', { config: newConfig });

            toast({
                title: 'Configuration mise à jour',
                description: `Intervalle de vérification: ${value} minute(s)`,
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: `Impossible de sauvegarder la configuration: ${error}`,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6 py-4">
            {/* Apparence */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Apparence</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="color-picker">Couleur du thème</Label>
                    <ColorPicker />
                </div>
            </div>

            <Separator />

            {/* Démarrage automatique */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Démarrage automatique</h3>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="auto-startup">Lancer au démarrage de Windows</Label>
                        <p className="text-sm text-muted-foreground">
                            L'application se lancera minimisée dans la barre système
                        </p>
                    </div>
                    <Switch
                        id="auto-startup"
                        checked={autoStartupEnabled}
                        onCheckedChange={handleAutoStartupToggle}
                        disabled={loading || checkingAutoStartup}
                    />
                </div>
            </div>

            <Separator />

            {/* Service de mise à jour automatique */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mises à jour automatiques</h3>

                {/* Toggle du service */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="background-service">Service de fond</Label>
                        <p className="text-sm text-muted-foreground">
                            Vérifie périodiquement les mises à jour de traduction
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {serviceRunning && (
                            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                <Power className="w-4 h-4" />
                                Actif
                            </span>
                        )}
                        {!serviceRunning && config.enabled && (
                            <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Démarrage...
                            </span>
                        )}
                        {!serviceRunning && !config.enabled && (
                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <PowerOff className="w-4 h-4" />
                                Inactif
                            </span>
                        )}
                        <Switch
                            id="background-service"
                            checked={config.enabled}
                            onCheckedChange={handleServiceToggle}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Configuration de l'intervalle */}
                <div className="space-y-3">
                    <Label htmlFor="check-interval">Intervalle de vérification (minutes)</Label>
                    <div className="flex items-center gap-3">
                        <Input
                            id="check-interval"
                            type="number"
                            min="5"
                            max="1440"
                            value={config.check_interval_minutes}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                    setConfig({ ...config, check_interval_minutes: value });
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 5) {
                                    handleIntervalChange(value);
                                }
                            }}
                            className="w-32"
                            disabled={loading}
                        />
                        <span className="text-sm text-muted-foreground">
                            Vérification toutes les {config.check_interval_minutes} minute(s)
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Minimum: 5 minutes • Recommandé: 5-10 minutes
                    </p>
                </div>

                {/* Informations */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Comment ça fonctionne ?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Le service vérifie périodiquement les mises à jour de traduction sur GitHub</li>
                        <li>Si une mise à jour est disponible, elle est automatiquement installée</li>
                        <li>Seules les versions du jeu avec traduction installée sont mises à jour</li>
                        <li>Le service fonctionne en arrière-plan sans ralentir votre système</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
