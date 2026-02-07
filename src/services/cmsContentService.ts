export interface CmsPageContent {
  title: string;
  intro?: string;
  sections: string[];
  updatedAt?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

type CmsSlug = "about" | "contact";

const FALLBACK_CONTENT: Record<CmsSlug, CmsPageContent> = {
  about: {
    title: "About Hits 93 Toronto",
    intro: "Hits 93 Toronto is a live online station focused on high-rotation hits and presenter-led shows.",
    sections: [
      "This page is CMS-ready. Update /public/content/about.json to publish station profile content.",
      "You can include presenter bios, schedule notes, and station story copy here."
    ]
  },
  contact: {
    title: "Contact",
    intro: "Connect with the station for requests, partnerships, and general enquiries.",
    sections: [
      "This page is CMS-ready. Update /public/content/contact.json to publish contact details.",
      "Include social links, request lines, studio contact info, and business enquiries."
    ]
  }
};

function isCmsPageContent(value: unknown): value is CmsPageContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CmsPageContent>;

  return (
    typeof candidate.title === "string" &&
    Array.isArray(candidate.sections) &&
    candidate.sections.every((section) => typeof section === "string")
  );
}

export async function fetchCmsPageContent(slug: CmsSlug): Promise<CmsPageContent> {
  try {
    const response = await fetch(`/content/${slug}.json`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return FALLBACK_CONTENT[slug];
    }

    const payload = (await response.json()) as unknown;
    if (!isCmsPageContent(payload)) {
      return FALLBACK_CONTENT[slug];
    }

    return payload;
  } catch {
    return FALLBACK_CONTENT[slug];
  }
}
