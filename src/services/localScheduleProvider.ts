import type { Programme, ScheduleProvider, ScheduleSnapshot } from "./scheduleProvider";

interface DailyProgrammeTemplate {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
}

const DAILY_TEMPLATE: DailyProgrammeTemplate[] = [
  {
    id: "breakfast-hitlist",
    name: "Breakfast Hitlist",
    description: "Fast-paced morning mix with headlines and shoutouts.",
    start: "06:00",
    end: "10:00"
  },
  {
    id: "midday-drive",
    name: "Midday Drive",
    description: "Toronto chart staples, listener picks, and quick updates.",
    start: "10:00",
    end: "14:00"
  },
  {
    id: "afternoon-live",
    name: "Afternoon Live",
    description: "Hot releases, throwback blend, and presenter interviews.",
    start: "14:00",
    end: "18:00"
  },
  {
    id: "rush-hour",
    name: "Rush Hour Rewind",
    description: "Peak-time anthems and back-to-back requests.",
    start: "18:00",
    end: "22:00"
  },
  {
    id: "overnight-frequencies",
    name: "Overnight Frequencies",
    description: "Non-stop continuous mix through late night.",
    start: "22:00",
    end: "23:59"
  },
  {
    id: "after-midnight",
    name: "After Midnight",
    description: "Low-key late-night tracks and fresh discoveries.",
    start: "00:00",
    end: "06:00"
  }
];

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  return { hours, minutes };
}

function createProgrammeForDate(template: DailyProgrammeTemplate, date: Date): Programme {
  const startDate = new Date(date);
  const endDate = new Date(date);

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
    description: template.description,
    startMs: startDate.getTime(),
    endMs: endDate.getTime()
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
