import { APPLE_MUSIC_DEVELOPER_TOKEN_ENDPOINT } from "../config/constants";
import type { Track } from "../types";

const MUSICKIT_SRC = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
const APPLE_MUSIC_API_BASE = "https://api.music.apple.com/v1";

let musicKitLoadPromise: Promise<unknown> | null = null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function loadMusicKit(): Promise<unknown> {
  if ((window as Window & { MusicKit?: unknown }).MusicKit) {
    return (window as Window & { MusicKit?: unknown }).MusicKit as unknown;
  }

  if (musicKitLoadPromise) {
    return musicKitLoadPromise;
  }

  musicKitLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MUSICKIT_SRC;
    script.async = true;
    script.onload = () => resolve((window as Window & { MusicKit?: unknown }).MusicKit as unknown);
    script.onerror = () => reject(new Error("Failed to load Apple MusicKit JS."));
    document.head.appendChild(script);
  });

  return musicKitLoadPromise;
}

async function fetchDeveloperToken(): Promise<string> {
  if (!APPLE_MUSIC_DEVELOPER_TOKEN_ENDPOINT) {
    throw new Error("Apple Music is not configured (missing APPLE_MUSIC_DEVELOPER_TOKEN_ENDPOINT).");
  }

  const response = await fetch(APPLE_MUSIC_DEVELOPER_TOKEN_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Apple Music token endpoint error ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { token?: unknown; developerToken?: unknown };
    const token = payload.token ?? payload.developerToken;
    if (isNonEmptyString(token)) {
      return token.trim();
    }
  }

  const tokenText = await response.text();
  if (!isNonEmptyString(tokenText)) {
    throw new Error("Apple Music token endpoint returned an empty token.");
  }

  return tokenText.trim();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;

        if (index >= items.length) {
          return;
        }

        results[index] = await mapper(items[index], index);
      }
    })
  );

  return results;
}

function appleMusicHeaders(developerToken: string, userToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${developerToken}`,
    "Content-Type": "application/json"
  };

  if (userToken) {
    headers["Music-User-Token"] = userToken;
  }

  return headers;
}

async function searchAppleMusicSongId(
  developerToken: string,
  storefront: string,
  track: Track
): Promise<string | null> {
  const term = `${track.title} ${track.artist}`.trim();
  if (!term) {
    return null;
  }

  const params = new URLSearchParams({
    term,
    types: "songs",
    limit: "1"
  });

  const response = await fetch(`${APPLE_MUSIC_API_BASE}/catalog/${encodeURIComponent(storefront)}/search?${params.toString()}`, {
    method: "GET",
    headers: appleMusicHeaders(developerToken)
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: {
      songs?: {
        data?: Array<{ id?: string }>;
      };
    };
  };

  const id = payload.results?.songs?.data?.[0]?.id;
  return isNonEmptyString(id) ? id : null;
}

export function isAppleMusicConfigured(): boolean {
  return Boolean(APPLE_MUSIC_DEVELOPER_TOKEN_ENDPOINT);
}

export async function exportEpisodePlaylistToAppleMusic(
  playlistName: string,
  playlistDescription: string,
  tracks: Track[]
): Promise<{ playlistId: string; matchedTracks: number; totalTracks: number }> {
  if (!tracks.length) {
    throw new Error("No tracks are available for this episode yet.");
  }

  const MusicKit = (await loadMusicKit()) as {
    configure?: (config: { developerToken: string; app: { name: string; build: string } }) => void;
    getInstance?: () => {
      authorize: () => Promise<string>;
      musicUserToken?: string;
      storefrontId?: string;
    };
  };

  if (!MusicKit?.configure || !MusicKit.getInstance) {
    throw new Error("Apple MusicKit is unavailable in this browser.");
  }

  const developerToken = await fetchDeveloperToken();
  MusicKit.configure({
    developerToken,
    app: {
      name: "Hits 93 Toronto",
      build: "1.0.0"
    }
  });

  const instance = MusicKit.getInstance();
  const userToken = await instance.authorize();
  const storefront = instance.storefrontId || "us";

  const songIds = await mapWithConcurrency(tracks, 3, async (track) =>
    searchAppleMusicSongId(developerToken, storefront, track)
  );

  const resolvedIds = songIds.filter((id): id is string => isNonEmptyString(id));

  const response = await fetch(`${APPLE_MUSIC_API_BASE}/me/library/playlists`, {
    method: "POST",
    headers: appleMusicHeaders(developerToken, userToken),
    body: JSON.stringify({
      attributes: {
        name: playlistName,
        description: playlistDescription
      },
      relationships: {
        tracks: {
          data: resolvedIds.map((id) => ({ id, type: "songs" }))
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Apple Music playlist create failed (${response.status}).`);
  }

  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const playlistId = payload.data?.[0]?.id;

  if (!isNonEmptyString(playlistId)) {
    throw new Error("Apple Music playlist create response did not include an id.");
  }

  return {
    playlistId,
    matchedTracks: resolvedIds.length,
    totalTracks: tracks.length
  };
}

