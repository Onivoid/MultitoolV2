import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { IconHome } from "@tabler/icons-react";
import {
  Dock,
  DockDropdownItem,
  DockIcon,
  DockItem,
} from "@/components/dock";
import { getBuildInfo } from "@/utils/buildInfo";
import {
  featuresRoutes,
  filterInfoRoutesForBuild,
  infoRoutes,
  newsRoutes,
} from "@/components/navigation/navigation.config";

export function AppDock() {
  const location = useLocation();
  const [filteredInfoRoutes, setFilteredInfoRoutes] = useState(infoRoutes);

  useEffect(() => {
    getBuildInfo()
      .then((buildInfo) => {
        setFilteredInfoRoutes(
          filterInfoRoutesForBuild(infoRoutes, buildInfo.distribution),
        );
      })
      .catch(() => {
        setFilteredInfoRoutes(infoRoutes);
      });
  }, []);

  return (
    <Dock
      activePage={location.pathname}
      bottomOffset="1.5rem"
      navClassName="!left-1/2 w-auto -translate-x-1/2"
    >
      <DockIcon
        href="/"
        icon={<IconHome size={20} className="text-foreground" />}
      />
      <DockItem label="Features" id="features">
        {featuresRoutes.map((route) => (
          <DockDropdownItem
            key={route.path}
            href={route.path}
            label={route.label}
          />
        ))}
      </DockItem>
      <DockItem label="News" id="news">
        {newsRoutes.map((route) => (
          <DockDropdownItem
            key={route.path}
            href={route.path}
            label={route.label}
          />
        ))}
      </DockItem>
      <DockItem label="Informations" id="informations">
        {filteredInfoRoutes.map((route) => (
          <DockDropdownItem
            key={route.path}
            href={route.path}
            label={route.label}
          />
        ))}
      </DockItem>
      <DockIcon
        href="/settings"
        icon={<Settings size={20} className="text-foreground" />}
      />
    </Dock>
  );
}
