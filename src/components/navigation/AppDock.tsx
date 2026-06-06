import { useLocation } from "react-router-dom";
import { Newspaper, Settings } from "lucide-react";
import { IconHome } from "@tabler/icons-react";
import {
  Dock,
  DockDivider,
  DockDropdownGroup,
  DockDropdownItem,
  DockIcon,
  DockItem,
} from "@/components/dock";
import {
  featuresRouteGroups,
  infoRoutes,
  newsRoute,
} from "@/components/navigation/navigation.config";

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

      <DockItem label="Fonctionnalités" id="fonctionnalites">
        {featuresRouteGroups.map((group) => (
          <DockDropdownGroup key={group.label} label={group.label}>
            {group.routes.map((route) => (
              <DockDropdownItem
                key={route.path}
                href={route.path}
                label={route.label}
                description={route.description}
                icon={route.icon}
              />
            ))}
          </DockDropdownGroup>
        ))}
      </DockItem>

      <DockDivider />

      <DockIcon
        href={newsRoute.path}
        ariaLabel={newsRoute.label}
        icon={<Newspaper size={20} className="text-foreground" />}
      />
      <DockItem label="Informations" id="informations">
        {infoRoutes.map((route) => (
          <DockDropdownItem
            key={route.path}
            href={route.path}
            label={route.label}
            description={route.description}
            icon={route.icon}
          />
        ))}
      </DockItem>

      <DockDivider />

      <DockIcon
        href="/settings"
        ariaLabel="Paramètres"
        icon={<Settings size={20} className="text-foreground" />}
      />
    </Dock>
  );
}
