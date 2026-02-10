import { Link } from "react-router-dom";

export function StationCtaBlock(): JSX.Element {
  return (
    <section className="programme-block" aria-label="Station actions">
      <section className="programme-block__cta-grid">
        <article className="programme-block__cta">
          <h3>Music Submissions</h3>
          <p>
            <Link to="/schedule/programmes/next-up">
              <em>Next Up</em>
            </Link>{" "}
            and{" "}
            <Link to="/schedule/programmes/next-wave">
              <em>Next Wave</em>
            </Link>{" "}
            air daily and are intended to help smaller artists reach a broader audience.
          </p>
          <p>
            <Link to="/contact">Submit through Contact Us</Link>.
          </p>
        </article>

        <article className="programme-block__cta">
          <h3>Support, Sponsorships &amp; Partnerships</h3>
          <p>Help keep Hits 93 Toronto growing through donations, sponsorships, and partnerships.</p>
          <p>
            <a href="https://paypal.me/Hits93Toronto" target="_blank" rel="noreferrer">
              Support on PayPal
            </a>{" "}
            or <Link to="/contact">contact us for sponsorship details</Link>.
          </p>
        </article>
      </section>
    </section>
  );
}

