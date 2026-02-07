import { Link } from "react-router-dom";
import { useScheduleSnapshot } from "../../hooks/useScheduleSnapshot";
import { formatClock, formatCountdown } from "../../utils/time";

export function ProgrammeBlock(): JSX.Element {
  const { current, next, progressPercent, remainingMs, loading, error } = useScheduleSnapshot(60000);

  return (
    <section className="programme-block">
      <div className="section-heading">
        <h2>Programme</h2>
      </div>
      <p className="programme-block__intro">Currently on air, plus what’s next in the schedule.</p>

      {loading && <p className="status-inline">Loading programme data...</p>}
      {error && <p className="status-inline status-inline--error">{error}</p>}

      {!loading && !error && (
        <>
          <article className="programme-block__current">
            <p className="programme-block__label">On now</p>
            {current ? (
              <h3>
                <Link to={`/schedule/programmes/${current.slug}`}>{current.name}</Link>
              </h3>
            ) : (
              <h3>Auto rotation</h3>
            )}
            <p>{current?.description ?? "Schedule currently unavailable; using fallback rotation."}</p>
            {current && (
              <p className="programme-block__time">
                {formatClock(current.startMs)} to {formatClock(current.endMs)}
              </p>
            )}
            <div className="programme-progress" role="progressbar" aria-valuenow={progressPercent}>
              <span style={{ width: `${progressPercent.toFixed(2)}%` }} />
            </div>
            <p className="programme-block__remaining">
              Time to next: {current ? formatCountdown(remainingMs) : "Awaiting next programme"}
            </p>
          </article>

          <article className="programme-block__next">
            <p className="programme-block__label">Next programme</p>
            {next ? (
              <h3>
                <Link to={`/schedule/programmes/${next.slug}`}>{next.name}</Link>
              </h3>
            ) : (
              <h3>TBC</h3>
            )}
            <p>{next?.description ?? "Waiting for schedule data."}</p>
            <p className="programme-block__time">
              {next ? `${formatClock(next.startMs)} to ${formatClock(next.endMs)}` : "Starts soon"}
            </p>
          </article>

          <div className="programme-block__links">
            <Link to="/schedule" className="control-pill control-pill--small">
              View full schedule
            </Link>
            <Link to="/jukebox" className="control-pill control-pill--small">
              Open Jukebox
            </Link>
          </div>

          <section className="programme-block__notes">
            <h3>Station notes</h3>
            <ul>
              <li>Canadian-owned and operated in Toronto, streaming worldwide.</li>
              <li>
                How to listen: press play, wait a moment to buffer, and if it still will not start,
                refresh once and try again.
              </li>
              <li>
                Ongoing issues: use the <Link to="/contact">Contact Us</Link> page.
              </li>
              <li>Recommended setup: quality headphones or speakers. Stream quality is up to 320 Kbps.</li>
              <li>
                Follow us: <a href="https://x.com/Hits93Toronto" target="_blank" rel="noreferrer">@Hits93Toronto</a>,{" "}
                <a href="https://instagram.com/Hits93Toronto" target="_blank" rel="noreferrer">Instagram</a>,{" "}
                <a href="https://facebook.com/Hits93TO" target="_blank" rel="noreferrer">Facebook</a>,{" "}
                <a href="https://youtube.com/@Hits93Toronto" target="_blank" rel="noreferrer">YouTube</a>.
              </li>
              <li>Search the library, request songs, and send shoutouts from the Jukebox page.</li>
              <li>Vote Like or Dislike on songs and share feedback through Contact Us.</li>
              <li>
                Support the station: <a href="https://paypal.me/Hits93Toronto" target="_blank" rel="noreferrer">PayPal.Me/Hits93Toronto</a>.
              </li>
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
