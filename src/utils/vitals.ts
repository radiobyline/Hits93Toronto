type VitalsSnapshot = {
  cls: number;
  lcp: number;
  inp: number;
};

function formatMs(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }
  return `${Math.round(value)}ms`;
}

function logSnapshot(label: string, snapshot: VitalsSnapshot): void {
  // Keep this intentionally lightweight and console-only. This is for manual verification.
  // Example usage: https://hits93.com/?vitals=1#/
  // eslint-disable-next-line no-console
  console.info(
    `[vitals] ${label} CLS=${snapshot.cls.toFixed(3)} LCP=${formatMs(snapshot.lcp)} INP=${formatMs(
      snapshot.inp
    )}`
  );
}

export function initVitalsLogger(): void {
  const snapshot: VitalsSnapshot = {
    cls: 0,
    lcp: 0,
    inp: 0
  };

  const observers: PerformanceObserver[] = [];
  let flushed = false;

  const safeObserve = (
    entryType: string,
    onEntry: (entry: PerformanceEntry) => void
  ): void => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onEntry(entry);
        }
      });

      // TS lib.dom types are behind on some entry types; cast to keep this dependency-free.
      observer.observe({ type: entryType, buffered: true } as unknown as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      // no-op
    }
  };

  safeObserve("layout-shift", (entry) => {
    const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
    if (shift.hadRecentInput) {
      return;
    }
    snapshot.cls += shift.value ?? 0;
  });

  safeObserve("largest-contentful-paint", (entry) => {
    // LCP is the latest entry's startTime.
    snapshot.lcp = Math.max(snapshot.lcp, entry.startTime);
  });

  safeObserve("interaction-to-next-paint", (entry) => {
    const inp = entry as PerformanceEntry & { duration?: number; value?: number };
    const value = inp.duration ?? inp.value ?? 0;
    snapshot.inp = Math.max(snapshot.inp, value);
  });

  const flush = (label: string) => {
    if (flushed) {
      return;
    }
    flushed = true;

    for (const observer of observers) {
      try {
        observer.disconnect();
      } catch {
        // no-op
      }
    }

    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    logSnapshot(label, snapshot);
  };

  const onPageHide = () => {
    flush("final");
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flush("final");
    }
  };

  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Helpful mid-flight snapshots while tuning.
  window.setTimeout(() => {
    if (!flushed) {
      logSnapshot("4s", snapshot);
    }
  }, 4000);
  window.setTimeout(() => {
    if (!flushed) {
      logSnapshot("10s", snapshot);
    }
  }, 10000);
}

