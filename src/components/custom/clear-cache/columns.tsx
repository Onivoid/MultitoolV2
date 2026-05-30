export {
  buildCacheColumns,
  type CacheFolder,
} from "@/features/cache/components/cacheColumns";
export type { CacheInfos } from "@/features/cache/cache.service";

/** @deprecated Utiliser buildCacheColumns depuis features/cache */
export type Folder = import("@/features/cache/cache.service").CacheFolder;
