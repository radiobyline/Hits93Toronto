import { resolvePublicAssetUrl } from "../utils/assets";

export const API_BASE = "https://hits93toronto.com:2490/api/v2";
export const STREAM_URL_HTTPS = "https://hits93toronto.com:2955/stream";
export const STREAM_URL_HTTP = "http://hits93toronto.com:2950/stream";
export const SERVER_ID = 1;
export const DEFAULT_ARTWORK_URL = resolvePublicAssetUrl("default-artwork.png");
export const POLL_INTERVAL_MS = 12000;
export const OPTIONAL_WORKER_PROXY_URL: string = "";
export const OPTIONAL_EPISODE_ARCHIVE_URL: string =
  "https://hits93-episode-archive.viktor-elias.workers.dev";
export const CONTACT_FORM_ENDPOINT = "https://formsubmit.co/ajax/contact@hits93.com";

export const HISTORY_PAGE_SIZE = 50;
export const HOME_RECENT_CARD_COUNT = 5;

export const SCHEDULE_GRID_LOOKBACK_DAYS = 1;
export const SCHEDULE_GRID_LOOKAHEAD_DAYS = 7;
export const SCHEDULE_EPISODE_LOOKBACK_DAYS = 14;

export const REQUEST_PAGE_SIZE = 12;
export const REQUEST_ORDER = 1;
export const REQUEST_WITH_TAGS_ONLY = true;
export const REQUEST_ONLY_REQUESTABLE = true;
export const REQUEST_IP_TIMEOUT = true;
export const REQUEST_TRACK_TIMEOUT = true;
