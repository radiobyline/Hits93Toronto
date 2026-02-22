export interface NewsPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl?: string;
  sections: string[];
}

interface NewsFeedPayload {
  title?: string;
  intro?: string;
  posts?: NewsPost[];
}

export interface NewsFeed {
  title: string;
  intro: string;
  posts: NewsPost[];
}

const FALLBACK_NEWS_FEED: NewsFeed = {
  title: "News",
  intro: "Station updates and announcements.",
  posts: []
};

function isNewsPost(value: unknown): value is NewsPost {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NewsPost>;

  return (
    typeof candidate.slug === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.excerpt === "string" &&
    Array.isArray(candidate.sections) &&
    candidate.sections.every((section) => typeof section === "string")
  );
}

export async function fetchNewsFeed(): Promise<NewsFeed> {
  try {
    const response = await fetch("/content/news.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      return FALLBACK_NEWS_FEED;
    }

    const payload = (await response.json()) as NewsFeedPayload;
    const posts = Array.isArray(payload.posts) ? payload.posts.filter((post) => isNewsPost(post)) : [];

    return {
      title: payload.title?.toString() || FALLBACK_NEWS_FEED.title,
      intro: payload.intro?.toString() || FALLBACK_NEWS_FEED.intro,
      posts
    };
  } catch {
    return FALLBACK_NEWS_FEED;
  }
}
