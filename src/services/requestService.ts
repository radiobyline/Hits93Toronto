import {
  REQUEST_IP_TIMEOUT,
  REQUEST_ONLY_REQUESTABLE,
  REQUEST_ORDER,
  REQUEST_PAGE_SIZE,
  REQUEST_TRACK_TIMEOUT,
  REQUEST_WITH_TAGS_ONLY,
  SERVER_ID
} from "../config/constants";
import type {
  RequestLibraryTrack,
  RequestSubmissionResult,
  SubmitRequestPayload
} from "../types";
import { buildApiUrl, fetchJson } from "./apiClient";

interface RequestSearchItem {
  id?: number;
  title?: string;
  author?: string;
  album?: string;
  requestable?: boolean;
  image_large?: string;
  image_medium?: string;
  tag_image?: string;
}

interface RequestSearchResponse {
  results?: RequestSearchItem[];
}

interface RequestErrorPayload {
  bad_params?: boolean;
  track_blocked?: boolean;
  ip_blocked?: boolean;
  detail?: string;
}

export const requestService = {
  async searchLibrary(query: string): Promise<RequestLibraryTrack[]> {
    const payload = await fetchJson<RequestSearchResponse>("/music/", {
      limit: REQUEST_PAGE_SIZE,
      offset: 0,
      search_q: query.trim(),
      server: SERVER_ID,
      with_tags_only: REQUEST_WITH_TAGS_ONLY,
      requestable: REQUEST_ONLY_REQUESTABLE,
      order: REQUEST_ORDER
    });

    const items = Array.isArray(payload.results) ? payload.results : [];

    return items
      .filter((item) => typeof item.id === "number")
      .map((item) => ({
        id: item.id as number,
        title: (item.title || "Unknown title").toString(),
        artist: (item.author || "Unknown artist").toString(),
        album: item.album?.toString(),
        artworkUrl: item.image_large || item.image_medium || item.tag_image || undefined
      }));
  },

  async submitRequest(payload: SubmitRequestPayload): Promise<RequestSubmissionResult> {
    if (!payload.trackId) {
      return {
        accepted: false,
        note: "No track selected."
      };
    }

    const musicId = Number(payload.trackId);
    if (!Number.isFinite(musicId)) {
      return {
        accepted: false,
        note: "Invalid track id."
      };
    }

    const response = await fetch(buildApiUrl("/track_requests/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        server_id: SERVER_ID,
        person: payload.requesterName ?? "",
        message: payload.message ?? "",
        music_id: musicId,
        ip_timeout: REQUEST_IP_TIMEOUT,
        track_timeout: REQUEST_TRACK_TIMEOUT
      })
    });

    let body: RequestErrorPayload = {};
    try {
      body = (await response.json()) as RequestErrorPayload;
    } catch {
      body = {};
    }

    if (response.ok) {
      return {
        accepted: true,
        referenceId: `request-${Date.now()}`,
        note: "Request sent successfully."
      };
    }

    if (body.track_blocked) {
      return {
        accepted: false,
        note: "Track is currently blocked for requests."
      };
    }

    if (body.ip_blocked) {
      return {
        accepted: false,
        note: "Requests temporarily blocked from this IP."
      };
    }

    if (body.bad_params) {
      return {
        accepted: false,
        note: "Request rejected due to invalid payload parameters."
      };
    }

    if (response.status === 401) {
      return {
        accepted: false,
        note: "Request endpoint requires authentication in this environment."
      };
    }

    return {
      accepted: false,
      note: `Request failed (${response.status}).`
    };
  }
};
