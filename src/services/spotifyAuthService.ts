import { SPOTIFY_CLIENT_ID } from "../config/constants";

interface SpotifyTokenStorage {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  tokenType?: string;
}

interface SpotifyPkceStorage {
  verifier: string;
  state: string;
  returnTo: string;
  createdAt: number;
}

const TOKEN_STORAGE_KEY = "hits93:spotify:tokens";
const PKCE_STORAGE_KEY = "hits93:spotify:pkce";
const PKCE_TTL_MS = 10 * 60 * 1000;

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const REQUIRED_SCOPES = ["playlist-modify-private", "playlist-modify-public", "user-read-private"];

function getRedirectUri(): string {
  // HashRouter stores the route in the fragment; keep redirect URI path-only.
  // Make sure this URI is allowlisted in the Spotify app settings.
  return `${window.location.origin}${window.location.pathname}`;
}

function readJsonStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return crypto.subtle.digest("SHA-256", data);
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  return base64UrlEncode(await sha256(verifier));
}

export function isSpotifyConfigured(): boolean {
  return Boolean(SPOTIFY_CLIENT_ID);
}

function getStoredTokens(): SpotifyTokenStorage | null {
  const stored = readJsonStorage<SpotifyTokenStorage>(TOKEN_STORAGE_KEY);
  if (!stored?.accessToken || !stored.expiresAt) {
    return null;
  }
  return stored;
}

function setStoredTokens(tokens: SpotifyTokenStorage): void {
  writeJsonStorage(TOKEN_STORAGE_KEY, tokens);
}

function getStoredPkce(): SpotifyPkceStorage | null {
  const stored = readJsonStorage<SpotifyPkceStorage>(PKCE_STORAGE_KEY);
  if (!stored?.verifier || !stored?.state || !stored?.returnTo) {
    return null;
  }

  if (Date.now() - stored.createdAt > PKCE_TTL_MS) {
    removeStorage(PKCE_STORAGE_KEY);
    return null;
  }

  return stored;
}

function setStoredPkce(pkce: SpotifyPkceStorage): void {
  writeJsonStorage(PKCE_STORAGE_KEY, pkce);
}

function clearPkce(): void {
  removeStorage(PKCE_STORAGE_KEY);
}

export async function beginSpotifyLogin(returnTo: string): Promise<void> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error("Spotify is not configured (missing SPOTIFY_CLIENT_ID).");
  }

  const verifier = randomString(64);
  const state = randomString(16);
  const challenge = await computeCodeChallenge(verifier);
  const redirectUri = getRedirectUri();

  setStoredPkce({
    verifier,
    state,
    returnTo,
    createdAt: Date.now()
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  window.location.assign(`${AUTH_ENDPOINT}?${params.toString()}`);
}

export async function completeSpotifyLogin(code: string, returnedState: string): Promise<string> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error("Spotify is not configured (missing SPOTIFY_CLIENT_ID).");
  }

  const pkce = getStoredPkce();
  if (!pkce) {
    throw new Error("Spotify login could not be completed (missing PKCE verifier).");
  }

  if (pkce.state !== returnedState) {
    clearPkce();
    throw new Error("Spotify login could not be completed (state mismatch).");
  }

  const redirectUri = getRedirectUri();
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: pkce.verifier
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    clearPkce();
    throw new Error(`Spotify token exchange failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!payload.access_token || !payload.expires_in) {
    clearPkce();
    throw new Error("Spotify token exchange returned an invalid response.");
  }

  setStoredTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    scope: payload.scope,
    tokenType: payload.token_type
  });

  clearPkce();
  return pkce.returnTo;
}

export async function getValidSpotifyAccessToken(): Promise<string | null> {
  const stored = getStoredTokens();
  if (!stored) {
    return null;
  }

  const skewMs = 60 * 1000;
  if (Date.now() < stored.expiresAt - skewMs) {
    return stored.accessToken;
  }

  if (!stored.refreshToken || !SPOTIFY_CLIENT_ID) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: stored.refreshToken
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!payload.access_token || !payload.expires_in) {
    return null;
  }

  setStoredTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? stored.refreshToken,
    expiresAt: Date.now() + payload.expires_in * 1000,
    scope: payload.scope ?? stored.scope,
    tokenType: payload.token_type ?? stored.tokenType
  });

  return payload.access_token;
}

