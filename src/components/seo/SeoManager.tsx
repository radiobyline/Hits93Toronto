import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getProgrammeCatalogEntry, getProgrammeNameBySlug } from "../../services/programmeCatalog";
import { resolvePublicAssetUrl } from "../../utils/assets";
import { getProgrammeArtworkUrl, resolveProgrammeSlug } from "../../utils/programme";

interface RouteSeo {
  title: string;
  description: string;
  imageUrl?: string;
}

const SITE_NAME = "Hits 93 Toronto";
const SITE_URL = "https://radiobyline.github.io/Hits93Toronto";
const DEFAULT_TITLE = "Hits 93 Toronto | Listen Live";
const DEFAULT_DESCRIPTION =
  "Hits 93 Toronto is an independent Toronto internet radio station streaming live worldwide 24/7 with current hits, pop, and dance favourites.";
const DEFAULT_IMAGE = `${SITE_URL}/branding/hits93-og-1200x630.jpg`;

const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "Hits 93 Toronto | Listen Live",
    description:
      "Listen live to Hits 93 Toronto: a 24/7 worldwide stream of current hits, pop, dance, and curated programming."
  },
  "/jukebox": {
    title: "Jukebox | Hits 93 Toronto",
    description:
      "Search the Hits 93 Toronto music library, preview tracks, and request songs from the Jukebox."
  },
  "/recent": {
    title: "Recently Played | Hits 93 Toronto",
    description: "Browse the complete Recently Played history for Hits 93 Toronto."
  },
  "/schedule": {
    title: "Program Schedule | Hits 93 Toronto",
    description: "See what is on air now, what is next, and explore daily program episodes."
  },
  "/news": {
    title: "News | Hits 93 Toronto",
    description: "Latest updates, announcements, and station news from Hits 93 Toronto."
  },
  "/about": {
    title: "About | Hits 93 Toronto",
    description:
      "Learn about Hits 93 Toronto, an independent online radio station streaming from Toronto to a global audience."
  },
  "/contact": {
    title: "Contact | Hits 93 Toronto",
    description: "Contact Hits 93 Toronto for feedback, media inquiries, and music submissions."
  },
  "/privacy": {
    title: "Privacy Policy | Hits 93 Toronto",
    description: "Read the Hits 93 Toronto Privacy Policy."
  },
  "/terms": {
    title: "Terms and Conditions | Hits 93 Toronto",
    description: "Read the Hits 93 Toronto Terms and Conditions."
  },
  "/llm-info": {
    title: "Official Information About Hits 93 Toronto",
    description:
      "Structured official information about Hits 93 Toronto for AI assistants and language models."
  },
  "/embed/player": {
    title: "Embedded Player | Hits 93 Toronto",
    description: "Lightweight embedded live player for Hits 93 Toronto."
  }
};

function upsertMeta(selector: string, attributes: Record<string, string>): void {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    node?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>): void {
  let node = document.head.querySelector<HTMLLinkElement>(selector);
  if (!node) {
    node = document.createElement("link");
    document.head.appendChild(node);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    node?.setAttribute(key, value);
  });
}

function toAbsoluteHashUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}/#${normalizedPath}`;
}

function toPlainPath(pathname: string): string {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }
  return pathname;
}

function toTitleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toAbsoluteAssetUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

function formatEpisodeStamp(startMsToken: string, dateIso: string): string {
  const startMs = Number(startMsToken);
  if (Number.isFinite(startMs) && startMs > 0) {
    const date = new Date(startMs);
    const dateLabel = date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const timeLabel = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
    return `${dateLabel} at ${timeLabel}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    const parsed = new Date(`${dateIso}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  }

  return "Episode";
}

function getRouteSeo(pathname: string): RouteSeo {
  if (pathname.startsWith("/schedule/programme/")) {
    const parts = pathname.split("/").filter(Boolean);
    const dateIso = parts[2] || "";
    const startMsToken = parts[3] || "";
    const rawSlug = parts[4] || "";
    const slug = resolveProgrammeSlug(rawSlug);
    const entry = getProgrammeCatalogEntry(slug);
    const programName = entry?.name ?? getProgrammeNameBySlug(slug, toTitleCase(slug) || "Program");
    const imageUrl = toAbsoluteAssetUrl(getProgrammeArtworkUrl(programName));
    const episodeStamp = formatEpisodeStamp(startMsToken, dateIso);

    return {
      title: `${programName} Episode | ${episodeStamp} | ${SITE_NAME}`,
      description: `Tracks played and episode details for ${programName} (${episodeStamp}) on Hits 93 Toronto.`,
      imageUrl
    };
  }

  if (pathname.startsWith("/schedule/programmes/")) {
    const parts = pathname.split("/").filter(Boolean);
    const rawSlug = parts[2] || "";
    const slug = resolveProgrammeSlug(rawSlug);
    const entry = getProgrammeCatalogEntry(slug);
    const programName = entry?.name ?? getProgrammeNameBySlug(slug, toTitleCase(slug) || "Program");
    const description =
      entry?.longDescription ??
      entry?.shortDescription ??
      `${programName} program page with description and recent episodes on Hits 93 Toronto.`;
    const imageUrl = toAbsoluteAssetUrl(getProgrammeArtworkUrl(programName));

    return {
      title: `${programName} | Program | ${SITE_NAME}`,
      description,
      imageUrl
    };
  }

  return ROUTE_SEO[pathname] ?? {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION
  };
}

export function SeoManager(): JSX.Element | null {
  const location = useLocation();

  useEffect(() => {
    const path = toPlainPath(location.pathname || "/");
    const hashUrl = toAbsoluteHashUrl(path);
    const seo = getRouteSeo(path);
    const imageUrl = seo.imageUrl ?? DEFAULT_IMAGE;
    const favicon = resolvePublicAssetUrl("branding/hits93-social-icon.png");
    const socialAvatar = resolvePublicAssetUrl("branding/hits93-social-avatar.png");

    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description
    });

    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website"
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: hashUrl
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image"
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: imageUrl
    });

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: hashUrl
    });
    upsertLink('link[rel="icon"][sizes="32x32"]', {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: favicon
    });
    upsertLink('link[rel="icon"][sizes="192x192"]', {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      href: socialAvatar
    });
    upsertLink('link[rel="apple-touch-icon"]', {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: socialAvatar
    });

    let script = document.head.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "jsonld");
      document.head.appendChild(script);
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "RadioStation",
      name: SITE_NAME,
      url: hashUrl,
      logo: `${SITE_URL}/branding/hits93-social-avatar.png`,
      image: imageUrl,
      sameAs: [
        "https://x.com/Hits93Toronto",
        "https://instagram.com/Hits93Toronto",
        "https://facebook.com/Hits93TO",
        "https://youtube.com/@Hits93Toronto",
        "https://linkedin.com/company/Hits93Toronto"
      ],
      areaServed: "Worldwide",
      inLanguage: "en",
      description: seo.description
    };
    script.textContent = JSON.stringify(jsonLd);
  }, [location.pathname]);

  return null;
}
