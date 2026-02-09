import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { completeSpotifyLogin } from "../../services/spotifyAuthService";

function removeAuthQueryParams(): void {
  const params = new URLSearchParams(window.location.search);
  params.delete("code");
  params.delete("state");
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;

  try {
    window.history.replaceState({}, "", nextUrl);
  } catch {
    // no-op
  }
}

export function SpotifyAuthHandler(): JSX.Element | null {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      return;
    }

    void (async () => {
      try {
        const returnTo = await completeSpotifyLogin(code, state);
        removeAuthQueryParams();
        navigate(returnTo || "/", { replace: true });
      } catch (error) {
        console.warn("Spotify auth completion failed:", error);
        removeAuthQueryParams();
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  return null;
}
