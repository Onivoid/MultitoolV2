import React, { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { DragRegion } from '@/components/custom/drag-region';
import { useLocation } from 'react-router-dom';
import { getAppVersionSync, formatVersion } from '@/utils/version';
import { Updater } from '@/components/Updater';


const Layout = ({ children }: { children: React.ReactNode }) => {

    const location = useLocation();
    const [path, setPath] = useState<string>('');
    const version = formatVersion(getAppVersionSync());
    useEffect(() => {
        if (location.pathname === '/') {
            setPath('');
            return;
        } else {
            setPath(location.pathname.split('/').join(''));
        }
    }, [location]);

    return (
        <DragRegion className="w-full h-screen max-h-screen max-w-full overflow-hidden">
            <SidebarProvider>
                <AppSidebar />
                <div className="mt-2 ml-2 flex h-full min-h-0 w-full flex-col">
                    <div className="flex w-max-content shrink-0 items-center">
                        <SidebarTrigger className="mt-1" />
                        <span className="mr-2 ml-1 font-bold text-primary">|</span>
                        <p className="font-bold">
                            Multitool {version}{" "}
                            {path ? `- ${path[0].toUpperCase() + path.slice(1)}` : null}
                        </p>
                    </div>
                    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>
                <Toaster />
                <Updater />
            </SidebarProvider>
        </DragRegion>
    )
};

export default Layout;
