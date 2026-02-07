export interface RawHistoryTrack {
  title?: string;
  author?: string;
  album?: string;
  ts?: number;
  length?: number;
  img_url?: string;
  img_medium_url?: string;
  img_large_url?: string;
  playlist_title?: string;
  metadata?: Record<string, unknown>;
  all_music_id?: string | number;
  [key: string]: unknown;
}

export interface Track {
  key: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl: string;
  startMs: number;
  lengthMs: number;
  endMs: number | null;
  allMusicId: number | null;
  playlistTitle?: string;
  raw: RawHistoryTrack;
}

export interface HistoryResult {
  tracks: Track[];
  current: Track | null;
  recent: Track[];
}

export type VoteDirection = "up" | "down";

export interface RequestLibraryTrack {
  id: number;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
}

export interface SubmitRequestPayload {
  trackId: string | number;
  requesterName?: string;
  message?: string;
}

export interface RequestSubmissionResult {
  accepted: boolean;
  referenceId?: string;
  note: string;
}
