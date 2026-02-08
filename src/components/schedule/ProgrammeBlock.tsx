import { Link } from "react-router-dom";
import { useScheduleSnapshot } from "../../hooks/useScheduleSnapshot";
import { formatClock } from "../../utils/time";

function formatEndsIn(remainingMs: number): string {
  if (remainingMs <= 0) {
    return "Ends now";
  }

  const totalMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  }

  if (!parts.length) {
    parts.push("1 min");
  }

  return `Ends in ${parts.join(" ")}`;
}

export function ProgrammeBlock(): JSX.Element {
  const { current, next, progressPercent, remainingMs, loading, error } = useScheduleSnapshot(60000);

  return (
    <section className="programme-block">
      <div className="section-heading">
        <h2>On Air &amp; Next</h2>
      </div>
      <p className="programme-block__intro">What&apos;s on now and what&apos;s next.</p>

      {loading && <p className="status-inline">Loading programme data...</p>}
      {error && <p className="status-inline status-inline--error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="programme-block__flow">
            <article className="programme-block__current">
              <p className="programme-block__label">Now Playing</p>
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
                {current ? formatEndsIn(remainingMs) : "Ends in --"}
              </p>
            </article>

            <article className="programme-block__next">
              <p className="programme-block__label">Up Next</p>
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
          </div>

          <div className="programme-block__links">
            <Link to="/schedule" className="control-pill control-pill--small">
              <span className="label-desktop">Full Schedule</span>
              <span className="label-mobile">Schedule</span>
            </Link>
          </div>

          <section className="programme-block__cta-grid">
            <article className="programme-block__cta">
              <h3>Music Submissions</h3>
              <p>
                <Link to="/schedule/programmes/next-up">
                  <em>Next Up</em>
                </Link>{" "}
                and{" "}
                <Link to="/schedule/programmes/next-wave">
                  <em>Next Wave</em>
                </Link>{" "}
                air daily and are intended to help smaller artists reach a broader audience.
              </p>
              <p>
                <Link to="/contact">Submit through Contact Us</Link>.
              </p>
            </article>

            <article className="programme-block__cta">
              <h3>Support, Sponsorships & Partnerships</h3>
              <p>Help keep Hits 93 Toronto growing through donations, sponsorships, and partnerships.</p>
              <p>
                <a href="https://paypal.me/Hits93Toronto" target="_blank" rel="noreferrer">
                  Support on PayPal
                </a>{" "}
                or <Link to="/contact">contact us for sponsorship details</Link>.
              </p>
            </article>
          </section>
        </>
      )}
    </section>
  );
}
