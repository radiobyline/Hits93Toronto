import type { Programme, ScheduleProvider, ScheduleSnapshot } from "./scheduleProvider";
import { getProgrammeArtworkUrl, resolveProgrammeSlug } from "../utils/programme";

interface DailyProgrammeTemplate {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  requestsEnabled?: boolean;
  timezone?: string;
}

const DAILY_TEMPLATE: DailyProgrammeTemplate[] = [
  {
    id: "bassline",
    name: "Bassline",
    description: "Deep catalogue and rhythmic pop to start the overnight hours.",
    start: "00:00",
    end: "02:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "after-hours",
    name: "After Hours",
    description: "Late-night selections, smooth transitions, and low-tempo discoveries.",
    start: "02:00",
    end: "05:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "prime-hits-am",
    name: "Prime Hits",
    description: "Top recurrent tracks and current chart movers.",
    start: "05:00",
    end: "07:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "first-light",
    name: "First Light",
    description: "Morning ramp-up with bright pop, throwbacks, and station updates.",
    start: "07:00",
    end: "10:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "prime-hits-midday",
    name: "Prime Hits",
    description: "High-rotation favorites and listener picks.",
    start: "10:00",
    end: "13:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "the-a-list",
    name: "The A-List",
    description: "The core daytime stack of biggest records and trending crossovers.",
    start: "13:00",
    end: "16:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "good-energy",
    name: "Good Energy",
    description: "Afternoon momentum with upbeat tracks and audience interaction.",
    start: "16:00",
    end: "19:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "the-drive",
    name: "The Drive",
    description: "Drive-time blend of current hits and familiar power songs.",
    start: "19:00",
    end: "22:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "next-wave",
    name: "Next Wave",
    description: "Fresh adds and breakout tracks on a nighttime clock.",
    start: "22:00",
    end: "23:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  },
  {
    id: "low-key",
    name: "Low Key",
    description: "Wind-down hour with mellow tempo and atmospheric curation.",
    start: "23:00",
    end: "00:00",
    requestsEnabled: true,
    timezone: "US/Eastern"
  }
];

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  return { hours, minutes };
}

function createProgrammeForDate(template: DailyProgrammeTemplate, date: Date): Programme {
  const startDate = new Date(date);
  const endDate = new Date(date);
  const slug = resolveProgrammeSlug(template.name);

  const { hours: startHours, minutes: startMinutes } = parseTime(template.start);
  const { hours: endHours, minutes: endMinutes } = parseTime(template.end);

  startDate.setHours(startHours, startMinutes, 0, 0);
  endDate.setHours(endHours, endMinutes, 0, 0);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return {
    id: `${template.id}-${startDate.toISOString().slice(0, 10)}`,
    name: template.name,
    slug,
    description: template.description,
    startMs: startDate.getTime(),
    endMs: endDate.getTime(),
    artworkUrl: getProgrammeArtworkUrl(template.name),
    timezone: template.timezone,
    requestsEnabled: template.requestsEnabled
  };
}

function createProgrammeSchedule(date: Date): Programme[] {
  return DAILY_TEMPLATE.map((template) => createProgrammeForDate(template, date)).sort(
    (a, b) => a.startMs - b.startMs
  );
}

export class LocalScheduleProvider implements ScheduleProvider {
  async getDaySchedule(date = new Date()): Promise<Programme[]> {
    return createProgrammeSchedule(date);
  }

  async getCurrentAndNext(now = new Date()): Promise<ScheduleSnapshot> {
    const scheduleToday = createProgrammeSchedule(now);
    const nowMs = now.getTime();

    const current = scheduleToday.find((programme) => {
      return nowMs >= programme.startMs && nowMs < programme.endMs;
    });

    if (current) {
      const currentIndex = scheduleToday.findIndex((programme) => programme.id === current.id);
      let next = scheduleToday[currentIndex + 1] ?? null;

      if (!next) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        next = createProgrammeSchedule(tomorrow)[0] ?? null;
      }

      return { current, next };
    }

    const nextToday = scheduleToday.find((programme) => nowMs < programme.startMs) ?? null;
    if (nextToday) {
      return { current: null, next: nextToday };
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return {
      current: null,
      next: createProgrammeSchedule(tomorrow)[0] ?? null
    };
  }
}
