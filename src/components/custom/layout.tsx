import React, { useEffect } from "react";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { DragRegion } from "@/components/custom/drag-region";
import { useLocation } from "react-router-dom";
import { getAppVersionSync, formatVersion } from "@/utils/version";
import { Updater } from "@/components/Updater";
import { AppDock } from "@/components/navigation/AppDock";

const routeTitles: Record<string, string> = {
  settings: "Paramètres",
  traduction: "Traduction",
  patchnotes: "Patchnotes",
  ships3d: "Vaisseaux 3D",
  news: "News SC",
  updates: "Mises à jour",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [path, setPath] = useState<string>("");
  const version = formatVersion(getAppVersionSync());

  useEffect(() => {
    if (location.pathname === "/") {
      setPath("");
      return;
    }
    const segment = location.pathname.split("/").filter(Boolean)[0] ?? "";
    setPath(routeTitles[segment] ?? segment);
  }, [location]);

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
