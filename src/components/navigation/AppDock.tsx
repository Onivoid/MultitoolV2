import { useLocation } from "react-router-dom";
import { LayoutGrid, Settings } from "lucide-react";
import { IconHome } from "@tabler/icons-react";
import { Dock, DockDivider, DockIcon } from "@/components/dock";
import { featuresHubRoute } from "@/components/navigation/navigation.config";

export function AppDock() {
  const location = useLocation();

  return (
    <Dock
      activePage={location.pathname}
      bottomOffset="1.5rem"
      navClassName="!left-1/2 w-auto -translate-x-1/2"
    >
      <DockIcon
        href="/"
        ariaLabel="Accueil"
        icon={<IconHome size={20} className="text-foreground" />}
      />

      <DockDivider />

      <DockIcon
        href={featuresHubRoute.path}
        ariaLabel="Applications"
        icon={<LayoutGrid size={20} className="text-foreground" />}
      />

      <DockDivider />

      <DockIcon
        href="/settings"
        ariaLabel="Paramètres"
        icon={<Settings size={20} className="text-foreground" />}
      />
    </Dock>
  );
}
