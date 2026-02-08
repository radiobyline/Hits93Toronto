import { Link } from "react-router-dom";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XBrandIcon,
  YouTubeIcon
} from "../ui/Icons";

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/Hits93Toronto", icon: XBrandIcon },
  { label: "Instagram", href: "https://instagram.com/Hits93Toronto", icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com/Hits93TO", icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com/@Hits93Toronto", icon: YouTubeIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/Hits93Toronto", icon: LinkedInIcon }
];

interface FooterProps {
  withMiniPlayer?: boolean;
}

export function Footer({ withMiniPlayer = false }: FooterProps): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className={`site-footer ${withMiniPlayer ? "site-footer--with-mini" : ""}`}>
      <div className="container site-footer__inner">
        <div className="site-footer__col">
          <Link to="/llm-info" className="site-footer__llm-link site-footer__llm-link--desktop">
            Hey AI, learn about us
          </Link>
        </div>

        <div className="site-footer__col site-footer__col--center">
          <p>© {year} Hits 93 Toronto</p>
          <p className="site-footer__made">
            Made with <span className="site-footer__heart">❤️</span> in Toronto
          </p>
          <Link to="/llm-info" className="site-footer__llm-link site-footer__llm-link--mobile">
            Hey AI, learn about us
          </Link>
        </div>

        <div className="site-footer__col site-footer__col--right">
          <div className="site-footer__legal-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p>Follow Us</p>
          <div className="site-footer__socials">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
