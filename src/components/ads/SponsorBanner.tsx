export function SponsorBanner(): JSX.Element {
  return (
    <a
      href="https://www.waterlilybeautysalon.com/"
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label="Water Lily Beauty Salon - Book Now"
      className="wl728-banner wl728-banner--native"
    >
      <img
        src="https://static.wixstatic.com/media/51fe70_8b19e92c62ed45909799fa6e706c3f14~mv2.png/v1/fill/w_298,h_136,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/51fe70_8b19e92c62ed45909799fa6e706c3f14~mv2.png"
        alt="Water Lily Beauty Salon"
        className="wl728-banner__logo"
        width={298}
        height={136}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />

      <div className="wl728-banner__content">
        <div className="wl728-banner__eyebrow">HITS 93 SPONSOR</div>
        <div className="wl728-banner__headline">Holistic Facials &amp; Beauty Treatments</div>
        <div className="wl728-banner__subhead">Midtown Toronto</div>
      </div>

      <span className="wl728-banner__cta">Book Now</span>
    </a>
  );
}
