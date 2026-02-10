import type { ReactNode } from "react";

interface LiveIndicatorProps {
  isActive: boolean;
  children?: ReactNode;
}

export function LiveIndicator({ isActive, children }: LiveIndicatorProps): JSX.Element {
  return (
    <span className={`live-indicator ${isActive ? "live-indicator--active" : ""}`}>
      <span className="live-indicator__dot" aria-hidden="true" />
      <span className="live-indicator__label">LIVE / ON AIR</span>
      {children && <span className="live-indicator__extra">{children}</span>}
    </span>
  );
}
