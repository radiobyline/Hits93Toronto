import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ThemeMode } from "../../hooks/useTheme";
import { resolvePublicAssetUrl } from "../../utils/assets";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "../ui/Icons";

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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === "dark";
  const logoSrc = resolvePublicAssetUrl("branding/hits93-logo.svg");

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = NAV_ITEMS.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `site-nav__link ${isActive ? "site-nav__link--active" : ""}`
      }
      onClick={() => {
        setMenuOpen(false);
      }}
    >
      {item.label}
    </NavLink>
  ));

  return (
    <header className="site-header">
      <div className="site-header__inner container container--hero">
        <button
          type="button"
          className="site-header__menu-toggle"
          onClick={() => {
            setMenuOpen((previous) => !previous);
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="brand-mark">
          <NavLink to="/" className="brand-mark__link" aria-label="Go to Live">
            <img className="brand-mark__logo" src={logoSrc} alt="HiTS 93 Toronto" />
          </NavLink>
        </div>

        <nav className="site-nav site-nav--desktop" aria-label="Primary">
          {navLinks}
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

      <div
        className={`site-nav-drawer ${menuOpen ? "site-nav-drawer--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="site-nav-drawer__backdrop"
          onClick={() => {
            setMenuOpen(false);
          }}
          aria-label="Close menu"
        />
        <div className="site-nav-drawer__panel" id="mobile-nav">
          <div className="site-nav-drawer__header">
            <p>Menu</p>
            <button
              type="button"
              className="site-header__menu-toggle"
              onClick={() => {
                setMenuOpen(false);
              }}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="site-nav site-nav--mobile" aria-label="Mobile primary">
            {navLinks}
          </nav>
        </div>
      </div>
    </header>
  );
}
