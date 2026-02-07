import { NavLink } from "react-router-dom";
import type { ThemeMode } from "../../hooks/useTheme";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Live" },
  { to: "/recent", label: "Recently Played" },
  { to: "/schedule", label: "Schedule" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" }
];

export function Header({ theme, onToggleTheme }: HeaderProps): JSX.Element {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <div className="brand-mark">
          <span className="brand-mark__eyebrow">Toronto Live Radio</span>
          <h1 className="brand-mark__title">Hits 93 Toronto</h1>
        </div>

        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `site-nav__link ${isActive ? "site-nav__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </header>
  );
}
