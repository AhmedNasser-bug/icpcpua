import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { NotificationBellMenu } from '../../features/notifications/components/NotificationBellMenu.jsx';
export function Header({
  user,
  onSignOut,
  token,
  theme,
  onThemeChange
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOnOutsideClick = event => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);
  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname]);
  const isCycleRoute = /^\/roadmaps\/[^/]+\/cycles(?:\/|$)/.test(location.pathname) || location.pathname.startsWith('/roadmaps/check-in/');
  const isActive = path => path === '/'
    ? location.pathname === '/'
    : path === '/events'
      ? location.pathname === '/events' || location.pathname.startsWith('/events/') || location.pathname.startsWith('/check-in/')
      : path === '/training'
        ? location.pathname === '/training' || location.pathname.startsWith('/training/') || isCycleRoute
        : path === '/roadmaps'
          ? (location.pathname === '/roadmaps' || location.pathname.startsWith('/roadmaps/')) && !isCycleRoute
          : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const profilePath = user?.role === 'user' && user.username ? `/users/${user.username}` : null;
  const accountActive = location.pathname.startsWith('/settings') || profilePath && location.pathname === profilePath;
  const navLink = (path, label) => <Link className={isActive(path) ? 'nav-link active' : 'nav-link'} to={path} aria-current={isActive(path) ? 'page' : undefined}>{label}</Link>;
  return <div className="site-header-shell">
      <header className="site-header">
        <div className="header-left-group">
          <Link className="brand" to="/" aria-label="PUA ICPC Community home" onClick={() => {
            setMenuOpen(false);
            setAccountOpen(false);
          }}>
            <span className="brand-logo-image-container">
              <svg className="brand-logo" viewBox="0 0 180 180" role="img" aria-label="PUA ICPC Logo">
                <defs>
                  <pattern id="brand-logo-dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="3" cy="3" r="1.2" fill="var(--brand-logo-ink)" />
                  </pattern>
                  <clipPath id="brand-logo-card-clip">
                    <rect x="0" y="0" width="144" height="144" rx="12" />
                  </clipPath>
                </defs>
                <g transform="translate(10 10)">
                  <rect x="14" y="14" width="144" height="144" rx="12" fill="#0f0f0f" />
                  <g clipPath="url(#brand-logo-card-clip)">
                    <rect width="144" height="144" fill="var(--color-surface, #fff9e4)" stroke="var(--brand-logo-ink)" strokeWidth="3" />
                    <line x1="0" y1="36" x2="144" y2="88" stroke="var(--color-secondary, #17e5e6)" strokeWidth="4" strokeLinecap="round" />
                    <line x1="0" y1="88" x2="144" y2="36" stroke="var(--color-secondary, #17e5e6)" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="72,42 42,0 58,0 72,42" fill="var(--brand-logo-yellow, #ffd600)" stroke="var(--brand-logo-ink)" strokeWidth="2" strokeLinejoin="round" />
                    <polygon points="72,42 86,0 102,0 72,42" fill="var(--brand-logo-yellow, #ffd600)" stroke="var(--brand-logo-ink)" strokeWidth="2" strokeLinejoin="round" />
                    <rect x="0" y="78" width="144" height="8" fill="var(--brand-logo-yellow, #ffd600)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <circle cx="72" cy="40" r="14" fill="var(--brand-logo-yellow, #ffd600)" stroke="var(--brand-logo-ink)" strokeWidth="2.5" />
                    <circle cx="68" cy="36" r="4" fill="#fff" opacity=".8" />
                    <rect x="58" y="58" width="28" height="8" rx="1" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="60" y="66" width="24" height="20" fill="var(--color-surface, #fff9e4)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="60" y="66" width="24" height="20" fill="url(#brand-logo-dots)" />
                    <rect x="57" y="86" width="30" height="12" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="55" y="98" width="34" height="16" fill="var(--color-surface, #fff9e4)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <path d="M67 114v-10a5 5 0 0 1 10 0v10Z" fill="var(--brand-logo-ink)" />
                    <rect x="53" y="114" width="38" height="12" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="47" y="126" width="50" height="6" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="38" y="128" width="12" height="6" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="2" />
                    <rect x="28" y="32" width="9" height="9" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="1.5" transform="rotate(15 28 32)" />
                    <rect x="118" y="62" width="8" height="8" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="1.5" transform="rotate(45 118 62)" />
                    <rect x="112" y="102" width="12" height="12" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="1.5" transform="rotate(12 112 102)" />
                    <rect x="38" y="136" width="7" height="7" fill="var(--color-primary, #7b2cbf)" stroke="var(--brand-logo-ink)" strokeWidth="1.5" />
                    <text x="18" y="94" className="brand-logo-code">{'{'}</text>
                    <text x="30" y="98" className="brand-logo-semi">;</text>
                    <text x="98" y="64" className="brand-logo-code">{'}'}</text>
                  </g>
                  <rect width="144" height="144" rx="12" fill="none" stroke="var(--brand-logo-ink)" strokeWidth="3" />
                </g>
              </svg>
            </span>
            <span className="brand-copy">
              <span className="brand-name">ICPC PUA</span>
            </span>
          </Link>
          <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Main navigation" onClick={event => {
            if (event.target.closest('a')) setMenuOpen(false);
          }}>
            {navLink('/', 'Home')}
            {user?.role === 'user' && navLink('/dashboard', 'Dashboard')}
            {navLink('/roadmaps', 'Roadmaps')}
            {navLink('/training', 'Training')}
            {navLink('/events', 'Events')}
            {navLink('/leaderboard', 'Leaderboard')}
          </nav>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`}
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          {user ? <>
          <NotificationBellMenu token={token} />
          <div className="account-menu" ref={accountMenuRef}>
            <button className={accountActive ? 'account-trigger active' : 'account-trigger'} type="button" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(open => !open)}>
              <span className="account-avatar" aria-hidden="true">
                {user.name.trim().charAt(0).toUpperCase()}
                {user.profile?.pictureUrl && <img src={user.profile.pictureUrl} alt="" onError={event => event.currentTarget.remove()} />}
              </span>
            </button>
            {accountOpen && <div className="account-dropdown" role="menu" aria-label="Account menu">
              {profilePath && <Link className={location.pathname === profilePath ? 'active' : ''} to={profilePath} role="menuitem" aria-current={location.pathname === profilePath ? 'page' : undefined} onClick={() => setAccountOpen(false)}>My Profile</Link>}
              <Link className={location.pathname.startsWith('/settings') ? 'active' : ''} to="/settings/account" role="menuitem" aria-current={location.pathname.startsWith('/settings') ? 'page' : undefined} onClick={() => setAccountOpen(false)}>Settings</Link>
              {user.role === 'admin' && <Link className={location.pathname.startsWith('/admin') ? 'active' : ''} to="/admin/overview" role="menuitem" aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined} onClick={() => setAccountOpen(false)}>Admin Dashboard</Link>}
              <div className="account-menu-divider" role="separator" />
              <button className="account-signout" type="button" role="menuitem" onClick={() => {
                setAccountOpen(false);
                setMenuOpen(false);
                onSignOut();
                navigate('/login', {
                  replace: true
                });
              }}>
                <LogOut size={15} aria-hidden="true" /> Sign Out
              </button>
            </div>}
          </div>
          </> : <div className="nav-auth-actions">
            <Link className="nav-login" to="/login">Log in</Link>
            <Link className="nav-register" to="/login?mode=register">Register</Link>
          </div>}
          <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
    </header>
    </div>;
}
export function Footer() {
  return <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-about">
            <Link className="footer-brand" to="/">PUA ICPC <span>COMMUNITY</span></Link>
            <p>Made for the love of the problem. Learn, practice, and compete together.</p>
            <span className="footer-location">Alexandria, Egypt · Est. 2024</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <b>Explore</b>
            <Link to="/">Home</Link>
            <Link to="/events">Events</Link>
            <Link to="/roadmaps">Roadmaps</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/login">Join the community</Link>
          </nav>
          <div className="footer-community">
            <b>Stay connected</b>
            <p>Join the community chat for event updates and announcements.</p>
            <a href="https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn" target="_blank" rel="noopener noreferrer">
              Join us on WhatsApp <ArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PUA ICPC Community</span>
          <span>Built for curious minds and problem solvers</span>
        </div>
      </div>
    </footer>;
}
