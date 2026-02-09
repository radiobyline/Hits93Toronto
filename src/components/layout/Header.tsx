import { useEffect, useRef, useState } from "react";
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
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const isTicking = useRef(false);
  const isDark = theme === "dark";
  const logoSrc = resolvePublicAssetUrl(
    isDark ? "branding/hits93-logo-header-dark.png" : "branding/hits93-logo-header-light.png"
  );
  const logoSrcSet = `${logoSrc} 1x, ${resolvePublicAssetUrl(
    isDark ? "branding/hits93-logo-header-dark@2x.png" : "branding/hits93-logo-header-light@2x.png"
  )} 2x`;

  useEffect(() => {
    setMenuOpen(false);
    setHeaderHidden(false);
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      setHeaderHidden(false);
      return;
    }

    lastScrollY.current = window.scrollY;

    const updateHeaderVisibility = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      const isNearTop = currentY < 24;

      if (isNearTop) {
        setHeaderHidden(false);
      } else if (delta > 4 && currentY > 110) {
        setHeaderHidden(true);
      } else if (delta < -4) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentY;
      isTicking.current = false;
    };

    const onScroll = () => {
      if (isTicking.current) {
        return;
      }

      isTicking.current = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [menuOpen]);

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
    <header className={`site-header ${headerHidden ? "site-header--hidden" : ""}`}>
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
            <img
              className="brand-mark__logo"
              src={logoSrc}
              srcSet={logoSrcSet}
              alt="HiTS 93 Toronto"
              width={80}
              height={54}
              decoding="async"
            />
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

      {menuOpen && (
        <div className="site-nav-drawer site-nav-drawer--open">
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
      )}
    </header>
  );
}
