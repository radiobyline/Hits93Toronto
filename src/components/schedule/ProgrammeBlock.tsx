import { useScheduleSnapshot } from "../../hooks/useScheduleSnapshot";
import { formatClock, formatCountdown } from "../../utils/time";

export function ProgrammeBlock(): JSX.Element {
  const { current, next, progressPercent, remainingMs, loading, error } = useScheduleSnapshot(60000);

  return (
    <section className="programme-block">
      <div className="section-heading">
        <h2>Programme</h2>
      </div>

      {loading && <p className="status-inline">Loading programme data...</p>}
      {error && <p className="status-inline status-inline--error">{error}</p>}

      {!loading && !error && (
        <>
          <article className="programme-block__current">
            <p className="programme-block__label">On now</p>
            <h3>{current?.name ?? "Auto rotation"}</h3>
            <p>{current?.description ?? "Schedule currently unavailable; using fallback rotation."}</p>
            <div className="programme-progress" role="progressbar" aria-valuenow={progressPercent}>
              <span style={{ width: `${progressPercent.toFixed(2)}%` }} />
            </div>
            <p className="programme-block__remaining">
              Time to next: {current ? formatCountdown(remainingMs) : "Awaiting next programme"}
            </p>
          </article>

          <article className="programme-block__next">
            <p className="programme-block__label">Next programme</p>
            <h3>{next?.name ?? "TBC"}</h3>
            <p>{next?.description ?? "Waiting for schedule data."}</p>
            <p className="programme-block__time">Starts {next ? formatClock(next.startMs) : "soon"}</p>
          </article>
        </>
      )}
    </section>
  );
}
