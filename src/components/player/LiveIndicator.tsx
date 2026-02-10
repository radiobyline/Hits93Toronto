import type { ReactNode } from "react";

interface LiveIndicatorProps {
  isActive: boolean;
  mode?: "standard" | "content";
  children?: ReactNode;
}

export function LiveIndicator({ isActive, mode = "standard", children }: LiveIndicatorProps): JSX.Element {
  const hasExtra = Boolean(children);
  const contentOnly = mode === "content" && hasExtra;

  return (
    <span className={`live-indicator ${isActive ? "live-indicator--active" : ""}`}>
      <span className="live-indicator__dot" aria-hidden="true" />
      {contentOnly ? (
        <span className="live-indicator__extra">{children}</span>
      ) : (
        <>
          <span className="live-indicator__label">LIVE / ON AIR</span>
          {children && (
            <>
              <span className="live-indicator__sep" aria-hidden="true">
                ·
              </span>
              <span className="live-indicator__extra">{children}</span>
            </>
          )}
        </>
      )}
    </span>
  );
}
