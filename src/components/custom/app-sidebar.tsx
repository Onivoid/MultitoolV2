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
import { Settings, BrushCleaning, Download } from "lucide-react";
import { IconBrandYoutube, IconHome, IconBrandDiscord, IconBrandSpotifyFilled, IconBrandTwitch, IconCloud, IconBrandGithub, IconBrandSoundcloud, IconLanguage, IconUsers } from "@tabler/icons-react";
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
        href: "https://open.spotify.com/intl-fr/artist/5fVXo1v7aQhY9Zy5Gys0HF?si=L4Pxex98TV2OC0L0pbVhuQ",
        icon: <IconBrandSpotifyFilled size={20} />,
        label: "Spotify",
        tooltip: "Spotify"
    },
    {
        href: "https://www.twitch.tv/onivoid_",
        icon: <IconBrandTwitch size={20} />,
        label: "Twitch",
        tooltip: "Twitch"
    },
    {
        href: "https://soundcloud.com/onivoid",
        icon: <IconBrandSoundcloud size={20} />,
        label: "Soundcloud",
        tooltip: "Soundcloud"
    },
    {
        href: "https://github.com/Onivoid",
        icon: <IconBrandGithub size={20} />,
        label: "Github",
        tooltip: "Github"
    },
    {
        href: "https://multitoolv2.onivoid.fr/",
        icon: <IconCloud size={20} />,
        label: "Site web",
        tooltip: "Site web"
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
import { Link, useLocation } from "react-router-dom";
import { ColorPicker } from "@/components/custom/color-picker";
import { useSidebar } from "@/components/ui/sidebar";
import openExternal from "@/utils/external";
import { useEffect, useState } from "react";
import { getBuildInfo, BuildInfo } from "@/utils/buildInfo";

export function AppSidebar() {
    const { state } = useSidebar();
    const location = useLocation();
    const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

    // Charger les informations de build au démarrage
    useEffect(() => {
        getBuildInfo()
            .then(setBuildInfo)
            .catch(console.error);
    }, []);

    // Filtrer les éléments du menu selon la distribution
    const getFilteredMenuItems = () => {
        if (!buildInfo) return menuItems; // Afficher tous les items si pas encore chargé

        return menuItems.filter(item => {
            // Masquer la page "Mises à jour" UNIQUEMENT pour Microsoft Store
            // Pour toutes les autres distributions (github, portable, unknown), afficher
            if (item.path === "/updates" && buildInfo.distribution === "microsoft-store") {
                return false;
            }
            // Afficher pour toutes les autres distributions
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
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Settings</DialogTitle>
                                    <DialogDescription asChild>
                                        <div>
                                            <ul className="text-foreground flex flex-col gap-4 mt-4">
                                                <li className="flex items-center gap-5 text-foreground">
                                                    <p className="min-w-[100px]">
                                                        Color Picker :{" "}
                                                    </p>
                                                    <ColorPicker />
                                                </li>
                                            </ul>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
