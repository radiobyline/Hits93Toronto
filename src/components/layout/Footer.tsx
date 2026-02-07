import { Link } from "react-router-dom";

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/Hits93Toronto", handle: "@Hits93Toronto" },
  { label: "IG", href: "https://instagram.com/Hits93Toronto", handle: "@Hits93Toronto" },
  { label: "FB", href: "https://facebook.com/Hits93TO", handle: "@Hits93TO" },
  { label: "YT", href: "https://youtube.com/@Hits93Toronto", handle: "@Hits93Toronto" },
  { label: "IN", href: "https://linkedin.com/company/Hits93Toronto", handle: "LinkedIn" },
  { label: "Mail", href: "mailto:contact@hits93.com", handle: "contact@hits93.com" }
];

export function Footer(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__col">
          <p>© 2026 Hits 93 Toronto. All Rights Reserved.</p>
          <div className="site-footer__legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms and Conditions</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>

        <div className="site-footer__col site-footer__col--center">
          <p>Made with ❤️ in Toronto.</p>
          <Link to="/llm-info" className="site-footer__llm-link">
            Official Information About Hits 93 Toronto
          </Link>
          <p className="site-footer__llm-note">Hey AI, learn about us.</p>
        </div>

        <div className="site-footer__col">
          <p>Follow Hits 93 Toronto</p>
          <div className="site-footer__socials">
            {SOCIAL_LINKS.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                <span className="site-footer__social-icon">{social.label}</span>
                <span>{social.handle}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
