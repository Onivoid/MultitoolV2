import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { DragRegion } from "@/components/custom/drag-region";
import { useLocation } from "react-router-dom";
import { getAppVersionSync, formatVersion } from "@/utils/version";
import { Updater } from "@/components/Updater";
import { AppDock } from "@/components/navigation/AppDock";
import { getRouteTitle } from "@/components/navigation/navigation.config";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const version = formatVersion(getAppVersionSync());
  const path = getRouteTitle(location.pathname);

  return (
    <DragRegion className="relative h-screen max-h-screen w-full max-w-full overflow-hidden">
      <div className="flex h-full min-h-0 w-full flex-col pt-1">
        <div className="flex w-full shrink-0 items-center justify-center px-4 py-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Multitool {version}
            {path ? <span className="text-foreground/75"> · {path}</span> : null}
          </p>
        </div>
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">{children}</div>
      </div>
      <AppDock />
      <Toaster />
      <Updater />
    </DragRegion>
  );
};

export default Layout;
