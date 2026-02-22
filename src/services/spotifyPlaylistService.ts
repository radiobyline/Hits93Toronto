import type { Track } from "../types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyUserProfile {
  id?: string;
}

interface SpotifyCreatePlaylistResponse {
  id?: string;
  external_urls?: {
    spotify?: string;
  };
}

interface SpotifySearchResponse {
  tracks?: {
    items?: Array<{
      uri?: string;
      name?: string;
      artists?: Array<{ name?: string }>;
    }>;
  };
}

export interface SpotifyPlaylistExportResult {
  playlistId: string;
  playlistUrl: string | null;
  totalTracks: number;
  matchedTracks: number;
  skippedTracks: Array<{ title: string; artist: string }>;
}

function buildSpotifyHeaders(accessToken: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    ...extra
  };
}

async function spotifyJson<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: buildSpotifyHeaders(accessToken, {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    })
  });

  if (!response.ok) {
    throw new Error(`Spotify API error ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
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

async function getCurrentUserId(accessToken: string): Promise<string> {
  const profile = await spotifyJson<SpotifyUserProfile>(accessToken, "/me", {
    method: "GET"
  });

  if (!profile.id) {
    throw new Error("Spotify profile is missing an id.");
  }

  return profile.id;
}

async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description: string
): Promise<{ playlistId: string; playlistUrl: string | null }> {
  const payload = await spotifyJson<SpotifyCreatePlaylistResponse>(accessToken, `/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false
    })
  });

  if (!payload.id) {
    throw new Error("Spotify playlist create response did not include an id.");
  }

  return {
    playlistId: payload.id,
    playlistUrl: payload.external_urls?.spotify ?? null
  };
}

async function searchTrackUri(accessToken: string, track: Track): Promise<string | null> {
  const q = `${track.title} ${track.artist}`.trim();
  if (!q) {
    return null;
  }

  const params = new URLSearchParams({
    q,
    type: "track",
    limit: "1"
  });

  const payload = await spotifyJson<SpotifySearchResponse>(accessToken, `/search?${params.toString()}`, {
    method: "GET"
  });

  const uri = payload.tracks?.items?.[0]?.uri;
  return typeof uri === "string" && uri.length > 0 ? uri : null;
}

async function addTracksToPlaylist(accessToken: string, playlistId: string, uris: string[]): Promise<void> {
  const chunkSize = 100;
  for (let index = 0; index < uris.length; index += chunkSize) {
    const chunk = uris.slice(index, index + chunkSize);
    await spotifyJson<Record<string, unknown>>(accessToken, `/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({
        uris: chunk
      })
    });
  }
}

export async function exportEpisodePlaylistToSpotify(
  accessToken: string,
  playlistName: string,
  playlistDescription: string,
  tracks: Track[]
): Promise<SpotifyPlaylistExportResult> {
  const totalTracks = tracks.length;
  if (!totalTracks) {
    throw new Error("No tracks are available for this episode yet.");
  }

  const userId = await getCurrentUserId(accessToken);
  const { playlistId, playlistUrl } = await createPlaylist(
    accessToken,
    userId,
    playlistName,
    playlistDescription
  );

  const uris = await mapWithConcurrency(tracks, 3, async (track) => searchTrackUri(accessToken, track));

  const skippedTracks: Array<{ title: string; artist: string }> = [];
  const resolvedUris: string[] = [];
  uris.forEach((uri, index) => {
    const track = tracks[index];
    if (!track) {
      return;
    }
    if (!uri) {
      skippedTracks.push({ title: track.title, artist: track.artist });
      return;
    }
    resolvedUris.push(uri);
  });

  if (resolvedUris.length) {
    await addTracksToPlaylist(accessToken, playlistId, resolvedUris);
  }

  return {
    playlistId,
    playlistUrl,
    totalTracks,
    matchedTracks: resolvedUris.length,
    skippedTracks
  };
}

