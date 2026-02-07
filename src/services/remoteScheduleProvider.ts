import {
  SCHEDULE_GRID_LOOKAHEAD_DAYS,
  SCHEDULE_GRID_LOOKBACK_DAYS,
  SERVER_ID
} from "../config/constants";
import { fetchJson } from "./apiClient";
import type { Programme, ScheduleProvider, ScheduleSnapshot } from "./scheduleProvider";

interface GridProgrammeItem {
  id?: number;
  name?: string;
  cast_type?: string;
  start_ts?: number;
  end_ts?: number;
  timezone?: string;
  allow_song_requests?: boolean;
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function mapGridItemToProgramme(item: GridProgrammeItem): Programme {
  const startSec = Number(item.start_ts) || 0;
  const endSec = Number(item.end_ts) || 0;

  const detailParts: string[] = [];
  if (item.cast_type) {
    detailParts.push(item.cast_type.replace(/_/g, " "));
  }
  if (item.allow_song_requests) {
    detailParts.push("requests enabled");
  }
  if (item.timezone) {
    detailParts.push(item.timezone);
  }

  return {
    id: `${item.id ?? "slot"}-${startSec}`,
    name: item.name?.toString() || "Programme",
    description: detailParts.join(" • ") || "Programme slot",
    startMs: startSec * 1000,
    endMs: endSec * 1000
  };
}

function isValidGridItem(item: GridProgrammeItem): boolean {
  const startSec = Number(item.start_ts);
  const endSec = Number(item.end_ts);

  return Number.isFinite(startSec) && Number.isFinite(endSec) && endSec > startSec;
}

export class RemoteScheduleProvider implements ScheduleProvider {
  private async fetchWindow(startTsSec: number, endTsSec: number): Promise<GridProgrammeItem[]> {
    const payload = await fetchJson<GridProgrammeItem[] | { results?: GridProgrammeItem[] }>(
      "/grid/",
      {
        start_ts: startTsSec,
        end_ts: endTsSec,
        server: SERVER_ID,
        utc: 1
      }
    );

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload.results)) {
      return payload.results;
    }

    return [];
  }

  async getCurrentAndNext(now = new Date()): Promise<ScheduleSnapshot> {
    const nowSec = toUnixSeconds(now);
    const startTsSec = nowSec - SCHEDULE_GRID_LOOKBACK_DAYS * 86400;
    const endTsSec = nowSec + SCHEDULE_GRID_LOOKAHEAD_DAYS * 86400;

    const items = (await this.fetchWindow(startTsSec, endTsSec))
      .filter(isValidGridItem)
      .sort((a, b) => Number(a.start_ts) - Number(b.start_ts));

    if (!items.length) {
      throw new Error("No schedule entries returned by /grid/ endpoint.");
    }

    const currentItem = items.find((item) => {
      const start = Number(item.start_ts);
      const end = Number(item.end_ts);
      return start <= nowSec && nowSec < end;
    });

    const nextItem = currentItem
      ? items.find((item) => Number(item.start_ts) >= Number(currentItem.end_ts)) ?? null
      : items.find((item) => Number(item.start_ts) > nowSec) ?? null;

    return {
      current: currentItem ? mapGridItemToProgramme(currentItem) : null,
      next: nextItem ? mapGridItemToProgramme(nextItem) : null
    };
  }

  async getDaySchedule(date = new Date()): Promise<Programme[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const startTsSec = toUnixSeconds(new Date(dayStart.getTime() - 86400 * 1000));
    const endTsSec = toUnixSeconds(new Date(dayEnd.getTime() + 86400 * 1000));

    const items = (await this.fetchWindow(startTsSec, endTsSec))
      .filter(isValidGridItem)
      .sort((a, b) => Number(a.start_ts) - Number(b.start_ts));

    const dayStartSec = toUnixSeconds(dayStart);
    const dayEndSec = toUnixSeconds(dayEnd);

    return items
      .filter((item) => {
        const start = Number(item.start_ts);
        const end = Number(item.end_ts);
        return end > dayStartSec && start < dayEndSec;
      })
      .map((item) => mapGridItemToProgramme(item));
  }
}
