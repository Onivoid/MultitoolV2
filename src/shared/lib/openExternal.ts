import { externalService } from "@/shared/api/external.service";

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" ||
      u.protocol === "http:" ||
      url.startsWith("ms-windows-store://")
    );
  } catch {
    return false;
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!isAllowedUrl(url)) return;
  await externalService.openUrl(url);
}

export default openExternalUrl;
