import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isHomeVisitEligiblePath } from "@/components/navigation/navigation.config";
import { homeService } from "@/features/home/home.service";

/** Enregistre les visites de routes features pour les raccourcis accueil. */
export function RouteVisitTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isHomeVisitEligiblePath(pathname)) {
      return;
    }
    void homeService.recordPageVisit(pathname).catch(() => {
      /* silencieux : pas bloquant pour la navigation */
    });
  }, [pathname]);

  return null;
}
