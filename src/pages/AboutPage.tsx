import { useEffect, useState } from "react";
import { fetchCmsPageContent, type CmsPageContent } from "../services/cmsContentService";

export function AboutPage(): JSX.Element {
  const [content, setContent] = useState<CmsPageContent | null>(null);

  useEffect(() => {
    let active = true;

    void fetchCmsPageContent("about").then((page) => {
      if (active) {
        setContent(page);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container">
      <section className="page-section placeholder-page">
        <h2>{content?.title ?? "About"}</h2>
        {content?.intro && <p>{content.intro}</p>}
        {content?.sections.map((section) => (
          <p key={section}>{section}</p>
        ))}
        {!content && <p>Loading content...</p>}
      </section>
    </div>
  );
}
