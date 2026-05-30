import type { CheckStatus } from "@/features/update/useUpdate";

export function getGithubReleasesUrl(githubRepo: string): string {
  return `https://github.com/${githubRepo}/releases`;
}

export function getStatusLabel(status: CheckStatus): string {
  switch (status) {
    case "checking":
      return "Vérification en cours…";
    case "available":
      return "Mise à jour disponible";
    case "up-to-date":
      return "À jour";
    case "error":
      return "Erreur";
    case "unsupported":
      return "Updater indisponible";
    default:
      return "En attente de vérification";
  }
}

export function getStatusBadgeVariant(
  status: CheckStatus,
): "default" | "destructive" | "secondary" {
  if (status === "available") return "default";
  if (status === "error") return "destructive";
  return "secondary";
}
