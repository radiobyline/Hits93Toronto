import { useEffect, useMemo, useState } from "react";
import { DEFAULT_ARTWORK_URL } from "../config/constants";
import { fetchNewsFeed, type NewsFeed, type NewsPost } from "../services/newsContentService";

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function NewsPage(): JSX.Element {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchNewsFeed().then((nextFeed) => {
      if (!active) {
        return;
      }

      setFeed(nextFeed);
      setSelectedSlug(nextFeed.posts[0]?.slug ?? null);
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedPost = useMemo<NewsPost | null>(() => {
    if (!feed) {
      return null;
    }

    if (!selectedSlug) {
      return feed.posts[0] ?? null;
    }

    return feed.posts.find((post) => post.slug === selectedSlug) ?? feed.posts[0] ?? null;
  }, [feed, selectedSlug]);

  return (
    <div className="container">
      <section className="page-section news-page">
        <h2>{feed?.title ?? "News"}</h2>
        <p className="page-section__lede">{feed?.intro ?? "Loading station updates..."}</p>

        {!feed && <p className="status-inline">Loading news...</p>}

        {feed && (
          <div className="news-page__grid">
            <aside className="news-page__list">
              {feed.posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  className={`news-page__list-item ${selectedPost?.slug === post.slug ? "news-page__list-item--active" : ""}`}
                  onClick={() => {
                    setSelectedSlug(post.slug);
                  }}
                >
                  <strong>{post.title}</strong>
                  <span>{formatDateLabel(post.date)}</span>
                  <p>{post.excerpt}</p>
                </button>
              ))}

              {!feed.posts.length && <p className="status-inline">No published stories yet.</p>}
            </aside>

            <article className="news-page__article">
              {selectedPost ? (
                <>
                  <img
                    src={selectedPost.imageUrl || DEFAULT_ARTWORK_URL}
                    alt={`${selectedPost.title} cover`}
                    className="news-page__cover"
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_ARTWORK_URL;
                    }}
                  />
                  <h3>{selectedPost.title}</h3>
                  <p className="news-page__date">{formatDateLabel(selectedPost.date)}</p>
                  {selectedPost.sections.map((section) => (
                    <p key={section}>{section}</p>
                  ))}
                </>
              ) : (
                <p className="status-inline">Select a story.</p>
              )}
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
