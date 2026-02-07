import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface PlayerViewportContextValue {
  isMainPlayerInView: boolean;
  setMainPlayerInView: (inView: boolean) => void;
}

const PlayerViewportContext = createContext<PlayerViewportContextValue | undefined>(undefined);

export function PlayerViewportProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isMainPlayerInView, setMainPlayerInView] = useState(true);

  const value = useMemo(
    () => ({
      isMainPlayerInView,
      setMainPlayerInView
    }),
    [isMainPlayerInView]
  );

  return <PlayerViewportContext.Provider value={value}>{children}</PlayerViewportContext.Provider>;
}

export function usePlayerViewport(): PlayerViewportContextValue {
  const context = useContext(PlayerViewportContext);
  if (!context) {
    throw new Error("usePlayerViewport must be used within PlayerViewportProvider");
  }

  return context;
}
