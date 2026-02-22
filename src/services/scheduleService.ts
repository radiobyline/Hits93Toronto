import { LocalScheduleProvider } from "./localScheduleProvider";
import { RemoteScheduleProvider } from "./remoteScheduleProvider";
import type { ScheduleProvider, ScheduleSnapshot, Programme } from "./scheduleProvider";

const remoteProvider = new RemoteScheduleProvider();
const fallbackProvider = new LocalScheduleProvider();

class RemoteWithFallbackScheduleProvider implements ScheduleProvider {
  async getCurrentAndNext(now = new Date()): Promise<ScheduleSnapshot> {
    try {
      return await remoteProvider.getCurrentAndNext(now);
    } catch {
      return fallbackProvider.getCurrentAndNext(now);
    }
  }

  async getDaySchedule(date = new Date()): Promise<Programme[]> {
    try {
      return await remoteProvider.getDaySchedule(date);
    } catch {
      return fallbackProvider.getDaySchedule(date);
    }
  }
}

export const scheduleProvider: ScheduleProvider = new RemoteWithFallbackScheduleProvider();
