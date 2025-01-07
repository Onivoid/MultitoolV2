import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/app-sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const path = window.location.pathname.split('/').join('');
    return (
        <main className="w-full h-screen max-h-screen max-w-full overflow-hidden">
            <SidebarProvider>
                <AppSidebar />
                <div className='flex items-center h-10 mt-2 ml-2'>
                    <SidebarTrigger className='mt-1'/>
                    <span className='mr-2 ml-1 text-primary font-bold'>|</span>
                    <p>Taurite {path ? `- ${path}` : null}</p>
                </div>
            </SidebarProvider>
            <div className='flex justify-center items-center w-full h-full' data-tauri-drag-region>
                {children}
            </div>
        </main>
)
};

export default Layout;