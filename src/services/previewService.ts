interface ITunesSong {
  previewUrl?: string;
}

interface ITunesSearchResponse {
  results?: ITunesSong[];
}

export async function fetchApplePreviewUrl(artist: string, title: string): Promise<string | null> {
  const query = encodeURIComponent(`${artist} ${title}`.trim());
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ITunesSearchResponse;
    const preview = payload.results?.[0]?.previewUrl;

    return typeof preview === "string" ? preview : null;
  } catch {
    return null;
  }
}
