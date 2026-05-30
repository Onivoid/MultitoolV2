import { FileText } from "lucide-react";
import type { VersionChangelog } from "@/features/patchnotes/patchnotes.lib";
import { formatVersion } from "@/utils/version";
import { cn } from "@/lib/utils";

interface VersionChangelogBlockProps {
  changelog: VersionChangelog;
  variant?: "current" | "available";
  scrollable?: boolean;
}

export function VersionChangelogBlock({
  changelog,
  variant = "current",
  scrollable = true,
}: VersionChangelogBlockProps) {
  const title = changelog.isFallback
    ? variant === "available"
      ? `Nouveautés ${formatVersion(changelog.version)} (dernière release documentée)`
      : `Notes ${formatVersion(changelog.version)} (dernière release documentée)`
    : variant === "available"
      ? `Nouveautés ${formatVersion(changelog.version)}`
      : `Notes ${formatVersion(changelog.version)}`;

  const content =
    changelog.lines.length > 0 ? (
      <ul className="space-y-1.5 pl-1">
        {changelog.lines.map((line, index) => (
          <li
            key={`${line}-${index}`}
            className="text-xs leading-relaxed text-muted-foreground"
          >
            {line}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs leading-relaxed text-muted-foreground">
        {changelog.releaseTitle}
      </p>
    );

  return (
    <div className="rounded-md border border-primary/12 bg-primary/5 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">{title}</p>
          {changelog.date && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{changelog.date}</p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-2 border-t border-primary/10 pt-2",
          scrollable && "max-h-28 overflow-y-auto pr-1",
        )}
        data-no-window-drag
      >
        {content}
      </div>
    </div>
  );
}
