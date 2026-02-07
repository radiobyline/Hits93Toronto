export interface Programme {
  id: string;
  name: string;
  slug: string;
  description: string;
  startMs: number;
  endMs: number;
  artworkUrl: string;
  timezone?: string;
  requestsEnabled?: boolean;
}

export interface ScheduleSnapshot {
  current: Programme | null;
  next: Programme | null;
}

export interface ScheduleProvider {
  getCurrentAndNext(now?: Date): Promise<ScheduleSnapshot>;
  getDaySchedule(date?: Date): Promise<Programme[]>;
}
