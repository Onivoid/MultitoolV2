import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { HangarExecToolbar } from "@/features/hangar-exec/components/HangarExecToolbar";
import { HangarHelpCards } from "@/features/hangar-exec/components/HangarHelpCards";
import { HangarTerminalCard } from "@/features/hangar-exec/components/HangarTerminalCard";
import { PyamStatusHero } from "@/features/hangar-exec/components/PyamStatusHero";
import { groupTerminalsByLocation } from "@/features/hangar-exec/hangarExec.lib";
import { useHangarExec } from "@/features/hangar-exec/useHangarExec";

export default function HangarExecPage() {
  const { status, terminals, timerByTerminalId, isLoading, startTimer, upcoming } =
    useHangarExec();

  const grouped = groupTerminalsByLocation(terminals);

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <HangarExecToolbar status={status} />

      {isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement du statut PYAM…" />
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} space-y-4 pb-20`}>
          {status && <PyamStatusHero status={status} />}

          {[...grouped.entries()].map(([location, locationTerminals]) => (
            <section key={location}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {location}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {locationTerminals.map((terminal) => {
                  const timer = timerByTerminalId.get(terminal.id);
                  return (
                    <HangarTerminalCard
                      key={terminal.id}
                      terminal={terminal}
                      secondsRemaining={timer?.secondsRemaining ?? null}
                      onStart={() => void startTimer(terminal)}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          <HangarHelpCards />

          {upcoming.length > 0 && (
            <section className="settings-section p-3">
              <h2 className="mb-2 text-sm font-semibold">Prochains cycles</h2>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {upcoming.slice(0, 6).map((event) => (
                  <li
                    key={`${event.cycleNumber}-${event.at}-${event.eventType}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      Cycle {event.cycleNumber} · {event.eventType}
                    </span>
                    <time className="shrink-0 tabular-nums text-foreground/80">
                      {new Date(event.at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageMotion>
  );
}
