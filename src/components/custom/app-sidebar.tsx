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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { ColorPicker } from "@/components/custom/color-picker";
import { DarkModeSelector } from "@/components/custom/darkmode-selector";

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent className="overflow-x-hidden">
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Pages
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip={"Accueil"} className="hover:text-primary" asChild>
                                    <Link to="/">
                                        <Home />
                                        <span>Accueil</span>
                                    </Link>
                                </SidebarMenuButton>
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
                                                        DarkMode :{" "}
                                                    </p>
                                                    <DarkModeSelector />
                                                </li>
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
