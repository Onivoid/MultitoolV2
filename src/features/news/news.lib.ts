export function extractThumbnail(
  html: string,
  tags: string[],
): { url: string | null; isVideo: boolean } {
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch) return { url: imgMatch[1], isVideo: false };

  const ytMatch = html.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  if (ytMatch) {
    return {
      url: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
      isVideo: true,
    };
  }

  const isVideo = tags.some((t) => t.toLowerCase() === "video");
  return { url: null, isVideo };
}

export function formatNewsDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function extractTitleFromUrl(url: string): string {
  const parts = url.split("/");
  const slug = parts[parts.length - 1] || "";
  return slug.replace(/^\d+-/, "").replace(/-/g, " ");
}
