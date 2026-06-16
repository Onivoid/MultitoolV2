import { useCallback, useEffect, useState } from "react";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export function useBlueprintWishlist(ownedIds: Set<string>) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const ids = await invokeCommand<string[]>(TAURI_COMMANDS.blueprintWishlistGet);
      setWishlistIds(new Set(ids));
    } catch {
      setWishlistIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (ownedIds.size === 0) return;
    void (async () => {
      try {
        const pruned = await invokeCommand<string[]>(
          TAURI_COMMANDS.blueprintWishlistPrune,
          { ownedBlueprintIds: [...ownedIds] },
        );
        setWishlistIds(new Set(pruned));
      } catch {
        /* ignore */
      }
    })();
  }, [ownedIds]);

  const toggleWishlist = useCallback(async (blueprintId: string) => {
    const ids = await invokeCommand<string[]>(TAURI_COMMANDS.blueprintWishlistToggle, {
      blueprintId,
    });
    setWishlistIds(new Set(ids));
    return ids;
  }, []);

  const isWishlisted = useCallback(
    (blueprintId: string) => wishlistIds.has(blueprintId),
    [wishlistIds],
  );

  return {
    wishlistIds,
    loading,
    toggleWishlist,
    isWishlisted,
    refresh,
  };
}
