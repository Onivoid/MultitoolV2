import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import type { Commit } from "@/types/commit";
import {
  getCommitDate,
  getCommitDisplayLines,
  getCommitMessage,
} from "@/features/patchnotes/patchnotes.lib";

interface PatchnoteCardProps {
  commit: Commit;
  index: number;
}

export function PatchnoteCard({ commit, index }: PatchnoteCardProps) {
  const displayLines = getCommitDisplayLines(commit);
  const message = displayLines[0] ?? getCommitMessage(commit);
  const date = getCommitDate(commit);
  const lines = displayLines.slice(1);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 10) * 0.04 }}
      className="settings-section overflow-hidden"
      data-no-window-drag
    >
      <header className="settings-section-header flex items-start gap-2 px-3 py-2 pl-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
          <Tag className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{message}</h3>
      </header>

      {lines.length > 0 && (
        <ul className="space-y-1.5 px-3 pb-3 pl-5">
          {lines.map((line, lineIndex) => (
            <li
              key={lineIndex}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {line}
            </li>
          ))}
        </ul>
      )}

      <footer className="settings-section-footer px-3 py-2 text-[11px] text-muted-foreground">
        <time>{date}</time>
      </footer>
    </motion.article>
  );
}
