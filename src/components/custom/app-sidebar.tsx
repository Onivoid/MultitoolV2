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
import { Settings, BrushCleaning, Download, Newspaper, Rocket, ScrollText } from "lucide-react";
import {
    IconBrandYoutube, IconHome, IconBrandDiscord,
    IconBrandTwitch, IconCloud, IconBrandGithub,
    IconLanguage, IconUsers
} from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { SettingsDialog } from "@/features/settings/SettingsDialog";
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
    },
    {
        path: "/news",
        icon: <Newspaper size={20} />,
        label: "News SC",
        tooltip: "News Star Citizen"
    },
    {
        path: "/ships3d",
        icon: <Rocket size={20} />,
        label: "Vaisseaux 3D",
        tooltip: "Vaisseaux 3D"
    },
    {
        path: "/blueprints",
        icon: <ScrollText size={20} />,
        label: "Blueprints",
        tooltip: "Blueprints débloqués (Game.log)"
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
                                                    onClick={() => openExternalUrl(link.href)}
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
                                            onClick={() => openExternalUrl(link.href)}
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
                                                    onClick={() => openExternalUrl(service.href)}
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
                                            onClick={() => openExternalUrl(service.href)}
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
                                <SettingsDialog />
                            </DialogContent>
                        </Dialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
