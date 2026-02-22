export const STOP_PREVIEWS_EVENT = "hits93:stop-previews";

export function emitStopPreviews(): void {
  window.dispatchEvent(new Event(STOP_PREVIEWS_EVENT));
}

export function onStopPreviews(handler: () => void): () => void {
  window.addEventListener(STOP_PREVIEWS_EVENT, handler);
  return () => {
    window.removeEventListener(STOP_PREVIEWS_EVENT, handler);
  };
}

