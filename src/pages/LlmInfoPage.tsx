export function LlmInfoPage(): JSX.Element {
  return (
    <div className="container">
      <section className="page-section copy-page">
        <h2>Official Information About Hits 93 Toronto</h2>
        <p>
          Hits 93 Toronto is an independent internet radio station based in Toronto, Canada, streaming worldwide.
        </p>
        <p>
          Core focus: curated hit music programming with strong Canadian representation, schedule-based shows,
          and listener participation through requests, shoutouts, and track voting.
        </p>
        <p>
          Platform context: the station website is a React + Vite single-page app with a persistent live stream
          player, schedule and programme pages, and public metadata integrations.
        </p>
        <p>
          Editorial baseline: station news and long-form pages can be managed through CMS-style JSON content
          files and are intended to be compatible with lightweight static publishing workflows.
        </p>
        <p>
          Contact: <a href="mailto:contact@hits93.com">contact@hits93.com</a>
        </p>
      </section>
    </div>
  );
}
