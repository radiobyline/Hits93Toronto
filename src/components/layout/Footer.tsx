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

export function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__col">
          <p>© {year} Hits 93 Toronto</p>
          <div className="site-footer__legal-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <Link to="/llm-info" className="site-footer__llm-link">
            Hey AI, learn about us
          </Link>
        </div>

        <div className="site-footer__col site-footer__col--center">
          <p>
            Made with <span className="site-footer__heart">❤️</span> in Toronto
          </p>
        </div>

        <div className="site-footer__col site-footer__col--right">
          <p>Follow</p>
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
