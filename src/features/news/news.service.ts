import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface NewsItem {
  id: string;
  url: string;
  tags: string[];
  summary: string;
  content_html: string;
  date_published: string;
}

export interface JsonFeed {
  items: NewsItem[];
}

export const newsService = {
  fetchFeed: async (): Promise<JsonFeed> => {
    const raw = await invokeCommand<string>(TAURI_COMMANDS.fetchRsiNews);
    return JSON.parse(raw) as JsonFeed;
  },
};
