import { Link } from "react-router-dom";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "../ui/Icons";
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

          <div className="programme-block__links">
            <Link to="/schedule" className="control-pill control-pill--small">
              <span className="label-desktop">Full Schedule</span>
              <span className="label-mobile">Schedule</span>
            </Link>
            <Link to="/jukebox" className="control-pill control-pill--small">
              <span className="label-desktop">Open Jukebox</span>
              <span className="label-mobile">Jukebox</span>
            </Link>
          </div>

          <section className="programme-block__notes">
            <h3>Listening Info</h3>
            <ul>
              <li>Independent Toronto station, streaming worldwide.</li>
              <li>Press play and allow a moment to buffer. If needed, refresh once.</li>
              <li>
                Issues? Visit <Link to="/contact">Contact</Link>.
              </li>
              <li>Stream quality up to 320 kbps. Headphones or speakers recommended.</li>
              <li>
                Follow:
                <span className="programme-block__socials">
                  <a href="https://instagram.com/Hits93Toronto" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <InstagramIcon />
                  </a>
                  <a href="https://facebook.com/Hits93TO" target="_blank" rel="noreferrer" aria-label="Facebook">
                    <FacebookIcon />
                  </a>
                  <a href="https://youtube.com/@Hits93Toronto" target="_blank" rel="noreferrer" aria-label="YouTube">
                    <YouTubeIcon />
                  </a>
                </span>
              </li>
              <li>Request songs and shoutouts via Jukebox.</li>
              <li>Rate tracks or send feedback.</li>
              <li>
                <a href="https://paypal.me/Hits93Toronto" target="_blank" rel="noreferrer">
                  Support the station
                </a>
                .
              </li>
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
