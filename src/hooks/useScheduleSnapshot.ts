import { useEffect, useState } from "react";
import { scheduleProvider } from "../services/scheduleService";
import type { Programme } from "../services/scheduleProvider";

export interface ProgrammeViewState {
  current: Programme | null;
  next: Programme | null;
  progressPercent: number;
  remainingMs: number;
  loading: boolean;
  error: string | null;
}

function computeProgress(current: Programme | null, nowMs: number): { progressPercent: number; remainingMs: number } {
  if (!current) {
    return { progressPercent: 0, remainingMs: 0 };
  }

  const duration = current.endMs - current.startMs;
  if (duration <= 0) {
    return { progressPercent: 0, remainingMs: 0 };
  }

  const elapsed = Math.max(0, Math.min(duration, nowMs - current.startMs));
  const remainingMs = Math.max(0, current.endMs - nowMs);
  const progressPercent = (elapsed / duration) * 100;

  return { progressPercent, remainingMs };
}

export function useScheduleSnapshot(refreshIntervalMs = 60000): ProgrammeViewState {
  const [state, setState] = useState<ProgrammeViewState>({
    current: null,
    next: null,
    progressPercent: 0,
    remainingMs: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    let active = true;

    const update = async () => {
      try {
        const snapshot = await scheduleProvider.getCurrentAndNext(new Date());
        if (!active) {
          return;
        }

        const nowMs = Date.now();
        const progress = computeProgress(snapshot.current, nowMs);

        setState({
          current: snapshot.current,
          next: snapshot.next,
          progressPercent: progress.progressPercent,
          remainingMs: progress.remainingMs,
          loading: false,
          error: null
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load schedule"
        }));
      }
    };

    void update();
    const timer = window.setInterval(() => {
      void update();
    }, refreshIntervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshIntervalMs]);

  return state;
}
