"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";
import type { CacheFolder } from "@/features/cache/cache.service";

export type { CacheFolder };

export function buildCacheColumns(
  onDelete: (path: string) => void,
): ColumnDef<CacheFolder>[] {
  return [
    { header: "Nom", accessorKey: "name" },
    { header: "Poids", accessorKey: "weight" },
    {
      header: " ",
      cell: ({ row }) => (
        <button type="button" onClick={() => onDelete(row.original.path)}>
          <Trash
            strokeWidth={3}
            className="h-4 w-4 hover:text-red-500 hover:cursor-pointer"
          />
        </button>
      ),
    },
  ];
}
