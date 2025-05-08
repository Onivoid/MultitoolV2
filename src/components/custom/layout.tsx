import React, { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { DragRegion } from '@/components/custom/drag-region';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [path, setPath] = useState<string>('');
    const version = import.meta.env.VITE_APP_VERSION;
    useEffect(() => {
        if (window.location.pathname === '/') {
            setPath('');
            return;
        } else {
            setPath(window.location.pathname.split('/').join(''));
        }
    }, [window.location.pathname]);
    return (
        <DragRegion className="w-full h-screen max-h-screen max-w-full overflow-hidden">
            <SidebarProvider>
                <AppSidebar />
                <div className='flex h-full mt-2 ml-2 flex-col w-full overflow-hidden'>
                    <div className='w-max-content flex items-center'>
                        <SidebarTrigger className='mt-1'/>
                        <span className='mr-2 ml-1 text-primary font-bold'>|</span>
                        <p className='font-bold'>Multitool {version} {path ? `- ${path}` : null}</p>
                    </div>
                    <div className="flex w-full h-full">
                        {children}
                    </div>
                </div>
                <Toaster />
            </SidebarProvider>
        </DragRegion>
)
};

export default Layout;