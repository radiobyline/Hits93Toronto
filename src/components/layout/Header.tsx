import { NavLink } from "react-router-dom";
import type { ThemeMode } from "../../hooks/useTheme";
import { MoonIcon, SunIcon } from "../ui/Icons";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Live" },
  { to: "/jukebox", label: "Jukebox" },
  { to: "/recent", label: "Recently Played" },
  { to: "/schedule", label: "Schedule" },
  { to: "/news", label: "News" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" }
];

export function Header({ theme, onToggleTheme }: HeaderProps): JSX.Element {
  const isDark = theme === "dark";

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <div className="brand-mark">
          <h1 className="brand-mark__title" aria-label="HiTS 93 Toronto">
            <span className="brand-mark__title-main">HiTS 93 Toronto</span>
          </h1>
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

        <div className="site-header__actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
