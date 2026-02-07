import { useEffect, useState } from "react";
import type { Programme } from "../services/scheduleProvider";
import { scheduleProvider } from "../services/scheduleService";
import { formatClock } from "../utils/time";

export function SchedulePage(): JSX.Element {
  const [items, setItems] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const daySchedule = await scheduleProvider.getDaySchedule(new Date());
        setItems(daySchedule);
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="container">
      <section className="page-section">
        <h2>Programme schedule</h2>
        <p className="page-section__lede">
          Uses the Streaming Center grid endpoint with automatic local fallback if unavailable.
        </p>

        {loading && <p className="status-inline">Loading schedule...</p>}
        {error && <p className="status-inline status-inline--error">{error}</p>}

        <div className="schedule-list">
          {items.map((item) => (
            <article className="schedule-list__item" key={item.id}>
              <div className="schedule-list__times">
                <strong>{formatClock(item.startMs)}</strong>
                <span>to</span>
                <strong>{formatClock(item.endMs)}</strong>
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
