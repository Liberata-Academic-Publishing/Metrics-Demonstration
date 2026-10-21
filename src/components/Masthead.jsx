import { useEffect, useRef, useState } from "react";
import logo from "../assets/liberata-logo.png";
import { TABS } from "../metrics";
import { setThemeMode } from "../theme";
import { useThemeMode } from "../useTheme";

const THEME_CHOICES = [
  ["system", "Device settings", MonitorIcon],
  ["light", "Day", SunIcon],
  ["dark", "Night", MoonIcon],
];

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 3.2a8.2 8.2 0 1 0 5.3 12.8A7.2 7.2 0 0 1 15.5 3.2z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 20h8M12 16v4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function Masthead({ current, group }) {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const menuRef = useRef(null);
  const themeRef = useRef(null);
  const [mode] = useThemeMode();
  const ThemeIcon = THEME_CHOICES.find(([id]) => id === mode)?.[2] || MonitorIcon;

  useEffect(() => {
    if (!open && !themeOpen) return undefined;
    const onPointer = (event) => {
      if (open && !menuRef.current?.contains(event.target)) setOpen(false);
      if (themeOpen && !themeRef.current?.contains(event.target)) setThemeOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, themeOpen]);

  return (
    <header className="masthead">
      <div className="lockup">
        <img src={logo} alt="" width="44" height="44" />
        <span className="org">Liberata</span>
      </div>
      <nav className="nav" aria-label="Pages">
        <a href="#/" aria-current={current === "explorer" ? "page" : undefined}>Explorer</a>
        <div className="nav-item" ref={menuRef}>
          <button
            type="button"
            className="nav-trigger"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-current={current === "metrics" ? "page" : undefined}
            onClick={() => setOpen((value) => !value)}
          >
            Metrics
          </button>
          {open ? (
            <div className="nav-pop" role="menu">
              {TABS.map(([id, label]) => (
                <a
                  key={id}
                  role="menuitem"
                  href={`#/metrics/${id}`}
                  aria-current={current === "metrics" && group === id ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <a href="https://liberata-academic-publishing.github.io/liberata-scientometrics/" target="_blank" rel="noopener noreferrer">Documentation</a>
        <a href="https://liberata.info/" target="_blank" rel="noopener noreferrer">About Liberata</a>
      </nav>
      <div className="theme-menu" ref={themeRef}>
        <button
          type="button"
          className="theme-trigger"
          aria-label="Color theme"
          aria-haspopup="menu"
          aria-expanded={themeOpen}
          onClick={() => setThemeOpen((value) => !value)}
        >
          <ThemeIcon />
        </button>
        {themeOpen ? (
          <div className="theme-pop" role="menu" aria-label="Color theme">
            {THEME_CHOICES.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={mode === id}
                onClick={() => {
                  setThemeMode(id);
                  setThemeOpen(false);
                }}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
