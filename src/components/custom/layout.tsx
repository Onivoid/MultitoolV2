import React, { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { useState } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [path, setPath] = useState<string>('');
    const version = import.meta.env.VITE_APP_VERSION;
    useEffect(() => {
        if (window.location.pathname === '/') {
            setPath('Home');
            return;
        } else {
            setPath(window.location.pathname.split('/').join(''));
        }
    }, [window.location.pathname]);
    return (
        <main className="w-full h-screen max-h-screen max-w-full overflow-hidden" data-tauri-drag-region>
            <SidebarProvider>
                <AppSidebar />
                <div className='flex items-center h-10 mt-2 ml-2'>
                    <SidebarTrigger className='mt-1'/>
                    <span className='mr-2 ml-1 text-primary font-bold'>|</span>
                    <p>Multitool {version} {path ? `- ${path}` : null}</p>
                </div>
            </SidebarProvider>
            <div className="flex justify-center items-center w-full h-full">
                {children}
            </div>
        </main>
)
};

export default Layout;