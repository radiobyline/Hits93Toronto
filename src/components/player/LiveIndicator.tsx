interface LiveIndicatorProps {
  isActive: boolean;
}

export function LiveIndicator({ isActive }: LiveIndicatorProps): JSX.Element {
  return (
    <span className={`live-indicator ${isActive ? "live-indicator--active" : ""}`}>
      <span className="live-indicator__dot" aria-hidden="true" />
      LIVE / ON AIR
    </span>
  );
}
