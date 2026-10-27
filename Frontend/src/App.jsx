import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Code2, ExternalLink, KeyRound, Link2, LogOut, MapPin, Menu, Moon, Palette, Plus, QrCode, Search, Shield, Sun, Ticket, Trash2, Trophy, UserRound, Users, X } from 'lucide-react';
import { api, eventDate } from './api.js';
import { AdminDashboardLayout, AdminOverviewPage } from './AdminDashboard.jsx';
import { AdminRoadmapsPage, MyRoadmapsSection, RoadmapCheckInPage, RoadmapCyclePage, RoadmapDetailsPage, RoadmapsPage } from './Roadmaps.jsx';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isValidUsername(value) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

function studentProfileForm(profile = {}, name = '') {
  return {
    name,
    pictureUrl: profile.pictureUrl || '',
    university: profile.university || '',
    academicYear: profile.academicYear || '',
    graduationYear: profile.graduationYear || '',
    bio: profile.bio || '',
    programmingLanguages: profile.programmingLanguages || [],
    technicalInterests: profile.technicalInterests || [],
    externalProfiles: {
      githubUrl: profile.externalProfiles?.githubUrl || '',
      linkedinUrl: profile.externalProfiles?.linkedinUrl || '',
      codeforcesHandle: profile.externalProfiles?.codeforcesHandle || '',
      codeforcesUrl: profile.externalProfiles?.codeforcesUrl || '',
      otherProfiles: profile.externalProfiles?.otherProfiles || [],
    },
    cpStats: {
      platform: profile.cpStats?.platform || '',
      handle: profile.cpStats?.handle || '',
      problemsSolved: profile.cpStats?.problemsSolved ?? '',
      contestsParticipated: profile.cpStats?.contestsParticipated ?? '',
      currentRating: profile.cpStats?.currentRating ?? '',
      highestRating: profile.cpStats?.highestRating ?? '',
    },
    icpcJourney: profile.icpcJourney || [],
    teamStatus: profile.teamStatus || '',
    teamPreferences: {
      preferredLanguage: profile.teamPreferences?.preferredLanguage || '',
      experience: profile.teamPreferences?.experience || '',
      schedule: profile.teamPreferences?.schedule || '',
      preference: profile.teamPreferences?.preference || '',
      introduction: profile.teamPreferences?.introduction || '',
    },
    trainingGoals: profile.trainingGoals || [],
    trainingTopics: profile.trainingTopics || [],
    milestones: profile.milestones || [],
    trainingProgress: profile.trainingProgress || '',
  };
}

function safeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function useSession() {
  const [token, setToken] = useState(() => localStorage.getItem('pua-token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const signOut = useCallback(() => {
    localStorage.removeItem('pua-token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/auth/me', { token })
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(signOut)
      .finally(() => setLoading(false));
  }, [token, signOut]);

  const acceptSession = (data) => {
    localStorage.setItem('pua-token', data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
  };
  const updateUser = (currentUser) => setUser(currentUser);
  return { token, user, loading, acceptSession, updateUser, signOut };
}

function NotificationBellMenu({ token }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const result = await api('/notifications', { token });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const markRead = async (notification) => {
    if (notification.readAt) return;
    setBusy(true);
    try {
      await api(`/notifications/${encodeURIComponent(notification._id)}/read`, { method: 'PATCH', token });
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification);
    setOpen(false);
    navigate(notification.link);
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      const result = await api('/notifications/read-all', { method: 'POST', token });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="notification-menu">
    <button className="notification-bell" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Bell size={19} />
      {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="notification-dropdown" role="dialog" aria-label="Recent notifications">
      <div className="notification-dropdown-heading"><strong>Notifications</strong>{unreadCount > 0 && <button type="button" disabled={busy} onClick={markAllRead}>Mark all read</button>}</div>
      {error && <div className="notification-inline-error" role="alert">{error}</div>}
      {notifications.length === 0 ? <p className="notification-empty">No notifications yet.</p> : notifications.slice(0, 5).map((notification) => <button className={notification.readAt ? 'notification-item' : 'notification-item unread'} type="button" key={notification._id} onClick={() => openNotification(notification)}>
        <span className="notification-item-title">{notification.title}</span>
        <span className="notification-item-message">{notification.message}</span>
        <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
      </button>)}
      <Link className="notification-view-all" to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
    </div>}
  </div>;
}

function Header({ user, onSignOut, token }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
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

  const isActive = (path) => path === '/'
    ? location.pathname === '/'
    : path === '/events'
      ? location.pathname === '/events' || location.pathname.startsWith('/events/') || location.pathname.startsWith('/check-in/')
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const profilePath = user?.role === 'user' && user.username ? `/users/${user.username}` : null;
  const accountActive = location.pathname.startsWith('/settings') || (profilePath && location.pathname === profilePath);

  const navLink = (path, label) => (
    <Link className={isActive(path) ? 'nav-link active' : 'nav-link'} to={path} aria-current={isActive(path) ? 'page' : undefined}>{label}</Link>
  );

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="PUA ICPC Community home" onClick={() => { setMenuOpen(false); setAccountOpen(false); }}>
        <img className="brand-logo" src="/pua-icpc-logo.png" alt="" />
      </Link>
      <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Main navigation" onClick={(event) => { if (event.target.closest('a')) setMenuOpen(false); }}>
        {navLink('/', 'Home')}
        {navLink('/roadmaps', 'Roadmaps')}
        {navLink('/events', 'Events')}
        {navLink('/leaderboard', 'Leaderboard')}
        {user ? (
          <>
          <NotificationBellMenu token={token} />
          <div className="account-menu" ref={accountMenuRef}>
            <button className={accountActive ? 'account-trigger active' : 'account-trigger'} type="button" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)}>
              <span className="account-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span className="account-name">{user.name}</span>
              <ChevronDown className={accountOpen ? 'account-chevron open' : 'account-chevron'} size={15} aria-hidden="true" />
            </button>
            {accountOpen && <div className="account-dropdown" role="menu" aria-label="Account menu">
              <Link className={location.pathname === '/my-activities' ? 'active' : ''} to="/my-activities" role="menuitem" aria-current={location.pathname === '/my-activities' ? 'page' : undefined} onClick={() => setAccountOpen(false)}>My Activities</Link>
              {profilePath && <Link className={location.pathname === profilePath ? 'active' : ''} to={profilePath} role="menuitem" aria-current={location.pathname === profilePath ? 'page' : undefined} onClick={() => setAccountOpen(false)}>My Profile</Link>}
              <Link className={location.pathname.startsWith('/settings') ? 'active' : ''} to="/settings/account" role="menuitem" aria-current={location.pathname.startsWith('/settings') ? 'page' : undefined} onClick={() => setAccountOpen(false)}>Settings</Link>
              {user.role === 'admin' && <Link className={location.pathname.startsWith('/admin') ? 'active' : ''} to="/admin/overview" role="menuitem" aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined} onClick={() => setAccountOpen(false)}>Admin Dashboard</Link>}
              <div className="account-menu-divider" role="separator" />
              <button className="account-signout" type="button" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); onSignOut(); navigate('/login', { replace: true }); }}>
                <LogOut size={15} aria-hidden="true" /> Sign Out
              </button>
            </div>}
          </div>
          </>
        ) : (
          <div className="nav-auth-actions">
            {navLink('/login', 'Log in')}
            <Link className="button button-dark nav-register" to="/login?mode=register">Register</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

function EventCard({ event, index }) {
  return (
    <article className={`event-card accent-${index % 4}`}>
      <div className="card-topline">
        <span className="category-label">{event.category}</span>
        <span className="event-mode">{event.mode === 'offline' ? 'IN PERSON' : 'ONLINE'}</span>
      </div>
      <Link className="card-title-link" to={`/events/${event.slug}`}>
        <h3>{event.title}</h3>
      </Link>
      <p className="card-description">{event.description}</p>
      <div className="event-meta"><CalendarDays size={16} /><span>{eventDate(event.startsAt)}</span></div>
      <div className="event-meta"><MapPin size={16} /><span>{event.mode === 'offline' ? event.location : 'Online'}</span></div>
      <div className="card-footer">
        <span>{event.capacity ? `${Math.max(event.capacity - event.registrationCount, 0)} spots left` : 'Open registration'}</span>
        <Link className="round-arrow" to={`/events/${event.slug}`} aria-label={`View ${event.title}`}><ArrowRight size={18} /></Link>
      </div>
    </article>
  );
}

function HomeEventCarouselCard({ event, index, now }) {
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt).getTime();
  const isUpcoming = startsAt > now;
  const isOngoing = startsAt <= now && endsAt > now;
  const registrationOpen = isUpcoming &&
    event.status === 'published' &&
    (!event.registrationDeadline || new Date(event.registrationDeadline).getTime() > now) &&
    (!event.capacity || event.registrationCount < event.capacity);

  return (
    <article className={`home-featured-event accent-${event.category.length % 4}`}>
      <div className="home-event-banner" aria-label={`${event.category} event banner`}>
        <span className="home-event-banner-category">{event.category}</span>
        <Code2 size={52} aria-hidden="true" />
        <span className="home-event-banner-mark" aria-hidden="true">{'{ }'}</span>
      </div>
      <div className="home-featured-event-content">
        <div className="home-featured-event-kicker">
          <span className="category-label">{event.category}</span>
          <span className={isOngoing ? 'home-event-status ongoing' : isUpcoming ? 'home-event-status upcoming' : 'home-event-status past'}>
            {isOngoing ? 'Ongoing' : isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>
        <h3><Link to={`/events/${event.slug}`}>{event.title}</Link></h3>
        <div className="home-featured-event-date"><CalendarDays size={17} /><span>{eventDate(event.startsAt)}</span></div>
        <div className="home-featured-event-actions">
          <Link className="text-link" to={`/events/${event.slug}`}>View details <ArrowRight size={16} /></Link>
          {registrationOpen && <Link className="button button-dark" to={`/events/${event.slug}`}>Register <ArrowRight size={16} /></Link>}
        </div>
      </div>
    </article>
  );
}

function AcpcCountdown() {
  const configuredTarget = import.meta.env.VITE_ACPC_TARGET_DATE;
  const targetValue = configuredTarget || '2027-08-01T00:00:00+03:00';
  const targetTime = Date.parse(targetValue);
  const [now, setNow] = useState(() => Date.now());
  const targetLabel = Number.isFinite(targetTime) && configuredTarget
    ? new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(targetTime)
    : configuredTarget ? 'configured date' : 'August 2027';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!Number.isFinite(targetTime)) {
    return <p className="acpc-countdown-unavailable" role="status">Countdown unavailable. Please check the ACPC target date configuration.</p>;
  }
  if (targetTime <= now) {
    return <p className="acpc-countdown-unavailable" role="status">The configured target has arrived. Keep training for the next milestone.</p>;
  }

  const remainingSeconds = Math.floor((targetTime - now) / 1000);
  const values = [
    ['Days', Math.floor(remainingSeconds / 86400)],
    ['Hours', Math.floor((remainingSeconds % 86400) / 3600)],
    ['Minutes', Math.floor((remainingSeconds % 3600) / 60)],
    ['Seconds', remainingSeconds % 60],
  ];

  return <>
    <div className="acpc-countdown" aria-label={`Countdown to ${targetLabel}: ${values.map(([unit, value]) => `${value} ${unit}`).join(', ')}`}>
      {values.map(([unit, value]) => <div className="acpc-countdown-unit" key={unit}><strong>{String(value).padStart(2, '0')}</strong><span>{unit}</span></div>)}
    </div>
    <p className="home-countdown-estimate">{configuredTarget ? `Configured target: ${targetLabel} · date and timezone are set in the frontend environment` : 'Estimated target: August 2027 · not an official competition date'}</p>
  </>;
}

function HomePage() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [carouselHovered, setCarouselHovered] = useState(false);
  const touchStartX = useRef(null);
  const eventsRef = useRef(events);
  const activeEventIndexRef = useRef(activeEventIndex);
  eventsRef.current = events;
  activeEventIndexRef.current = activeEventIndex;

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refreshEvents = async (initial = false) => {
      if (refreshing) return;
      refreshing = true;
      try {
        const result = await api('/events?sort=latest', { cache: 'no-store' });
        if (!active) return;
        const currentTime = Date.now();
        const latestEvents = [...new Map(result.events.map((event) => [event.id, event])).values()]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        const currentEventId = eventsRef.current[activeEventIndexRef.current]?.id;
        const nextIndex = latestEvents.findIndex((event) => event.id === currentEventId);
        setActiveEventIndex(nextIndex >= 0 ? nextIndex : 0);
        setEvents(latestEvents);
        setNow(currentTime);
        setEventsError('');
      } catch (reason) {
        if (active) setEventsError(reason.message);
      } finally {
        refreshing = false;
        if (active && initial) setLoadingEvents(false);
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshEvents();
    };

    refreshEvents(true);
    const refreshTimer = window.setInterval(() => refreshEvents(), 60_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    setActiveEventIndex((index) => events.length ? index % events.length : 0);
  }, [events.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (!carouselHovered && events.length > 1) setActiveEventIndex((index) => (index + 1) % events.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [carouselHovered, events.length]);

  const goToEvent = (direction) => {
    setActiveEventIndex((index) => (index + direction + events.length) % events.length);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) >= 45 && events.length > 1) goToEvent(delta < 0 ? 1 : -1);
  };

  return <main className="home-page">
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> PUA ICPC COMMUNITY · ROAD TO ACPC</span>
          <h1>ICPC PUA — <span>Road to ACPC</span></h1>
          <p className="home-hero-lead">Building the next generation of problem solvers, one challenge at a time.</p>
          <p className="home-hero-mission">Our goal is to help PUA students build and prepare the first team from our university to qualify for ACPC.</p>
          <div className="home-hero-actions">
            <Link className="button button-dark" to="/roadmaps">Start your journey <ArrowRight size={17} /></Link>
            <Link className="button button-outline" to="/events">Explore events <ArrowRight size={17} /></Link>
          </div>
        </div>
        <aside className="home-countdown-panel" aria-label="Countdown to our estimated ACPC target">
          <span className="eyebrow">THE ROAD AHEAD</span>
          <h2>Every day brings us closer to ACPC.</h2>
          <AcpcCountdown />
        </aside>
      </div>
    </section>

    <section className="home-events-section" aria-labelledby="home-events-title">
      <div className="home-section-heading">
        <div><span className="eyebrow">LEARN BY DOING</span><h2 id="home-events-title">Our <span>Events</span></h2><p>Meet the community, take on a challenge, and grow through competition.</p></div>
        <div className="home-carousel-actions">
          <button className="home-carousel-control" type="button" aria-label="Previous event" onClick={() => goToEvent(-1)} disabled={events.length < 2}><ChevronLeft size={20} /></button>
          <button className="home-carousel-control" type="button" aria-label="Next event" onClick={() => goToEvent(1)} disabled={events.length < 2}><ChevronRight size={20} /></button>
          <Link className="text-link" to="/events">All events <ArrowRight size={15} /></Link>
        </div>
      </div>
      {eventsError && <div className="notice error-notice" role="alert">{eventsError} <Link className="text-link" to="/events">Browse events</Link></div>}
      {loadingEvents ? <div className="empty-state"><span className="loader" /> Loading events...</div>
        : events.length ? <>
          <div className="home-carousel-viewport" onMouseEnter={() => setCarouselHovered(true)} onMouseLeave={() => setCarouselHovered(false)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-live="polite">
            <HomeEventCarouselCard key={events[activeEventIndex].id} event={events[activeEventIndex]} index={activeEventIndex} now={now} />
          </div>
          <div className="home-carousel-pagination" role="group" aria-label="Choose an event">
            {events.map((event, index) => <button key={event.id} className={activeEventIndex === index ? 'home-carousel-dot active' : 'home-carousel-dot'} type="button" aria-label={`Show event ${index + 1}: ${event.title}`} aria-current={activeEventIndex === index ? 'true' : undefined} onClick={() => setActiveEventIndex(index)} />)}
          </div>
        </> : !eventsError && <div className="home-empty-events"><CalendarDays size={22} /><p>No events are available to feature right now. Check back soon or explore the roadmaps.</p><Link className="text-link" to="/roadmaps">Explore roadmaps <ArrowRight size={15} /></Link></div>}
    </section>

    <section className="home-roadmap-section">
      <div className="home-section-inner home-split-layout">
        <div className="home-section-copy"><span className="eyebrow">A CLEAR PATH FORWARD</span><h2>Our <span>Roadmap</span></h2><p>Build problem-solving skills one step at a time with structured learning paths, focused cycles, and sessions that help you keep moving.</p><Link className="button button-dark" to="/roadmaps">Explore roadmaps <ArrowRight size={16} /></Link></div>
        <div className="home-roadmap-visual" aria-hidden="true"><div className="home-roadmap-node"><span>01</span><b>Learn</b></div><div className="home-roadmap-node"><span>02</span><b>Practice</b></div><div className="home-roadmap-node"><span>03</span><b>Compete</b></div></div>
      </div>
    </section>

    <section className="home-training-section">
      <div className="home-section-inner home-split-layout home-training-layout">
        <div className="home-training-visual" aria-hidden="true"><div className="home-training-board"><span>while (curious) {'{'}</span><b>solve();</b><span>{'}'}</span></div></div>
        <div className="home-section-copy"><span className="eyebrow">PRACTICE WITH PURPOSE</span><h2>Our <span>Training</span></h2><p>Competitive programming is a team effort. Learn core techniques, practice consistently, and prepare alongside students who share your ambition.</p><Link className="button button-dark" to="/roadmaps">Find your training path <ArrowRight size={16} /></Link></div>
      </div>
    </section>

    <section className="home-goal-section">
      <div className="home-section-inner">
        <div className="home-goal-heading"><span className="eyebrow">OUR SHARED AMBITION</span><h2>One University. One Goal. <span>ACPC.</span></h2><p>We are working toward our first PUA team qualifying for ACPC. Every practice session, solved problem, and competition is another step toward that goal.</p></div>
        <ol className="home-goal-timeline">
          <li><span>01</span><div><strong>Build the fundamentals</strong><p>Strengthen problem-solving foundations together.</p></div></li>
          <li><span>02</span><div><strong>Practice consistently</strong><p>Turn learning into a regular habit.</p></div></li>
          <li><span>03</span><div><strong>Grow as a team</strong><p>Develop collaboration and contest skills.</p></div></li>
          <li><span>04</span><div><strong>Prepare for qualification</strong><p>Work toward PUA’s first ACPC-qualified team.</p></div></li>
        </ol>
        <p className="home-goal-note">These are milestones we are working toward—not completed achievements.</p>
      </div>
    </section>
  </main>;
}

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (status === 'past') params.set('status', 'past');
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    api(`/events?${params}`)
      .then(({ events: result }) => {
        if (!active) return;
        setEvents(result);
        setCategories((current) => [...new Set([...current, ...result.map((event) => event.category)])].sort());
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [status, query, category]);

  return (
    <main className="events-page">
      <section className="events-section" id="events">
        <div className="section-heading">
          <div><span className="eyebrow">WHAT'S HAPPENING</span><h1>Our <span>Events</span></h1><p>Explore upcoming competitions, workshops, and community activities.</p></div>
          <div className="event-tabs" role="tablist">
            <button className={status === 'upcoming' ? 'tab active' : 'tab'} onClick={() => setStatus('upcoming')}>Upcoming</button>
            <button className={status === 'past' ? 'tab active' : 'tab'} onClick={() => setStatus('past')}>Past events</button>
          </div>
        </div>
        <div className="filter-row">
          <label className="search-box"><Search size={18} /><input aria-label="Search events" placeholder="Search events..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {error && <div className="notice error-notice">{error}</div>}
        {loading ? <div className="empty-state"><span className="loader" /> Loading events...</div> :
          events.length ? <div className="event-grid">{events.map((event, index) => <EventCard key={event.id} event={event} index={index} />)}</div> :
            <div className="empty-state"><span className="empty-icon"><CalendarDays size={24} /></span><h3>No events found</h3><p>Try a different search or check back soon for new events.</p></div>}
      </section>
      <section className="community-strip"><div className="strip-icon"><Users size={21} /></div><div><b>Better together.</b><span>New to competitive programming? This is your place to start.</span></div><Link to="/login">Meet the community <ArrowRight size={16} /></Link></section>
    </main>
  );
}

function EventDetail({ token, user }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const [{ event: current }, mine] = await Promise.all([
      api(`/events/${encodeURIComponent(eventId)}`),
      token ? api('/events/my', { token }) : Promise.resolve({ events: [] }),
    ]);
    setEvent(current);
    setRegistered(mine.events.some((item) => item.event.id === current.id));
  }, [eventId, token]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, [load]);

  const register = async () => {
    if (!token) return navigate('/login', { state: { from: `/events/${eventId}` } });
    setBusy(true);
    setMessage('');
    try {
      await api(`/events/${event.id}/registrations`, { method: 'POST', token });
      setRegistered(true);
      await load();
      setMessage('You’re registered! Your event is waiting in My Activities.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api(`/events/${event.id}/registrations`, { method: 'DELETE', token });
      setRegistered(false);
      await load();
      setMessage('Your registration has been cancelled.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="page-wrap"><div className="empty-state"><span className="loader" /> Loading event...</div></div>;
  if (!event) return <div className="page-wrap"><div className="notice error-notice">{message || 'Event not found.'}</div><Link className="text-link" to="/">Back to events</Link></div>;
  const closed = event.status !== 'published' || new Date(event.startsAt) <= new Date() ||
    (event.registrationDeadline && new Date(event.registrationDeadline) <= new Date()) ||
    (event.capacity && event.registrationCount >= event.capacity);

  return (
    <main className="page-wrap">
      <Link className="back-link" to="/"><ChevronLeft size={16} /> All events</Link>
      <article className="detail-card">
        <div className={`detail-banner accent-${event.category.length % 4}`}>
          <span className="category-label">{event.category}</span>
          <span className="detail-decoration"><Code2 size={54} /></span>
        </div>
        <div className="detail-content">
          <div className="card-topline"><span className="event-mode">{event.mode === 'offline' ? 'IN PERSON' : 'ONLINE'}</span><span className={closed ? 'availability closed' : 'availability'}>{closed ? 'REGISTRATION CLOSED' : 'REGISTRATION OPEN'}</span></div>
          <h1>{event.title}</h1>
          <div className="detail-meta">
            <div><CalendarDays size={18} /><span><b>{eventDate(event.startsAt)}</b><small>Event date</small></span></div>
            <div><Clock3 size={18} /><span><b>{eventDate(event.endsAt, { hour: 'numeric', minute: '2-digit' })}</b><small>Ends</small></span></div>
            <div><MapPin size={18} /><span><b>{event.mode === 'offline' ? event.location : 'Online'}</b><small>Location</small></span></div>
          </div>
          <p className="detail-description">{event.description}</p>
          {event.capacity && <p className="spots-note">{event.registrationCount} of {event.capacity} spots taken</p>}
          <p className="points-note"><Trophy size={16} /> {event.attendancePoints ?? 0} attendance points</p>
          {message && <div className={`notice ${message.includes('registered') || message.includes('cancelled') ? 'success-notice' : 'error-notice'}`}>{message}</div>}
          <div className="detail-actions">
            {registered ? <><span className="registered-badge"><Check size={17} /> You’re registered</span><button className="button button-outline" disabled={busy || closed} onClick={cancel}>Cancel registration</button></> :
              <button className="button button-dark" disabled={busy || closed} onClick={register}>{busy ? 'Please wait...' : closed ? 'Registration closed' : 'Register for this event'} <ArrowRight size={17} /></button>}
            {user && <Link className="text-link" to="/my-activities">My Activities</Link>}
          </div>
        </div>
      </article>
    </main>
  );
}

function StudentIdField({ id, label, value, onChange }) {
  return (
    <div className="student-id-entry">
      <label htmlFor={id}>{label}<input id={id} autoComplete="off" inputMode="numeric" pattern="[0-9]{4,20}" title="Enter 4–20 digits." required maxLength="20" value={value} onChange={onChange} /></label>
    </div>
  );
}

function AuthPage({ session }) {
  const location = useLocation();
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const from = location.state?.from || '/my-activities';

  useEffect(() => {
    setMode(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');
    setError('');
  }, [location.search]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        setBusy(false);
        return;
      }
      const username = normalizeUsername(form.username);
      if (!isValidUsername(username)) {
        setError('Username must be 3–20 characters using letters, numbers, and underscores.');
        setBusy(false);
        return;
      }
      setForm((current) => ({ ...current, username }));
    }

    try {
      const payload = mode === 'register'
        ? { name: form.name, email: form.email, username: normalizeUsername(form.username), password: form.password }
        : { email: form.email, password: form.password };
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      session.acceptSession(result);
      if (!result.user?.username) {
        navigate('/onboarding/username', { replace: true, state: { from } });
        return;
      }
      navigate(from, { replace: true });
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  if (session.user) return <Navigate to={session.user.username ? '/my-activities' : '/onboarding/username'} replace />;

  return (
    <main className="auth-layout">
      <div className="auth-art"><span className="eyebrow">GOOD PEOPLE. HARD PROBLEMS.</span><h1>Your next<br />breakthrough<br /><span>starts here.</span></h1><div className="auth-symbol">{'{ }'}</div></div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE CREW'}</span>
        <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
        <p>{mode === 'login' ? 'Pick up where you left off.' : 'Get into events, training, and everything ICPC.'}</p>
        {mode === 'register' && <label>Your name<input autoComplete="name" required maxLength="80" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>{mode === 'register' ? 'University email address' : 'Email address'}<input autoComplete="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        {mode === 'register' && <label>Username<input autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>}
        <label>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" minLength="8" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {mode === 'register' && <label>Confirm password<input autoComplete="new-password" type="password" minLength="8" required value={form.confirmPassword || ''} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>}
        {error && <div className="notice error-notice">{error}</div>}
        <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment...' : mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={17} /></button>
        <p className="auth-switch">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
      </form>
    </main>
  );
}

function UsernameSetupPage({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(session.user?.username || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/my-activities';

  if (!session.user) return <Navigate to="/login" replace />;
  if (session.user.username) return <Navigate to={from} replace />;

  const submit = async (event) => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError('Username must be 3–20 characters using letters, numbers, and underscores.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/username', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ username: normalized }),
      });
      session.updateUser(result.user);
      navigate(from, { replace: true });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="page-heading"><span className="eyebrow">WELCOME</span><h1>Choose your <span>username.</span></h1><p>Pick a username to continue using the ICPC Community. It must be 3–20 characters using only letters, numbers, and underscores.</p></div>
      <section className="settings-card" aria-labelledby="username-onboarding-title">
        <h2 id="username-onboarding-title">Username required</h2>
        <p>Your account is ready, but your username is required before you can continue. This helps keep member profiles consistent and prevents duplicates.</p>
        <form onSubmit={submit} className="student-id-form">
          <label htmlFor="onboarding-username">Username<input id="onboarding-username" autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save username'} <ArrowRight size={16} /></button>
        </form>
      </section>
    </main>
  );
}

function RequireUsername({ session, children }) {
  const location = useLocation();

  if (session.loading) {
    return <div className="empty-state"><span className="loader" /> Loading your account...</div>;
  }
  if (!session.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!session.user.username && location.pathname !== '/onboarding/username') {
    return <Navigate to="/onboarding/username" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

function SettingsPage({ session, theme, onThemeChange }) {
  const { section } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [studentId, setStudentId] = useState('');
  const [username, setUsername] = useState(session.user.username || '');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [studentProfile, setStudentProfile] = useState(() => studentProfileForm(session.user.profile, session.user.name));
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const [privacySuccess, setPrivacySuccess] = useState('');
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [notificationPreferenceError, setNotificationPreferenceError] = useState('');
  const [notificationPreferenceSuccess, setNotificationPreferenceSuccess] = useState('');
  const [notificationPreferenceBusy, setNotificationPreferenceBusy] = useState(false);

  useEffect(() => {
    setUsername(session.user.username || '');
  }, [session.user.username]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setBusy(true);
    try {
      const result = await api('/auth/password', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      setSuccess(result.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const saveStudentId = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileBusy(true);
    try {
      const result = await api('/auth/student-id', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ studentId }),
      });
      session.updateUser(result.user);
      setStudentId('');
    } catch (reason) {
      setProfileError(reason.message);
    } finally {
      setProfileBusy(false);
    }
  };

  const saveUsername = async (event) => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setUsernameError('Username must be 3–20 characters using letters, numbers, and underscores.');
      return;
    }

    setUsernameError('');
    setUsernameBusy(true);
    try {
      const result = await api('/auth/username', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ username: normalized }),
      });
      session.updateUser(result.user);
    } catch (reason) {
      setUsernameError(reason.message);
    } finally {
      setUsernameBusy(false);
    }
  };

  const updateStudentProfileField = (field, value) => {
    setStudentProfile((current) => ({ ...current, [field]: value }));
    setProfileFieldErrors((current) => ({ ...current, [field]: '' }));
    setProfileSaveSuccess('');
  };

  const updateNestedProfileField = (section, field, value) => {
    setStudentProfile((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
    setProfileFieldErrors((current) => ({ ...current, [`${section}.${field}`]: '' }));
    setProfileSaveSuccess('');
  };

  const cancelStudentProfile = () => {
    setStudentProfile(studentProfileForm(session.user.profile, session.user.name));
    setProfileFieldErrors({});
    setProfileSaveError('');
    setProfileSaveSuccess('');
  };

  const saveStudentProfile = async (event) => {
    event.preventDefault();
    const errors = {};
    const urls = [['pictureUrl', studentProfile.pictureUrl]];
    urls.forEach(([field, value]) => {
      if (value && !safeExternalUrl(value)) errors[field] = 'Enter a valid HTTP or HTTPS URL.';
    });
    setProfileFieldErrors(errors);
    setProfileSaveError('');
    setProfileSaveSuccess('');
    if (Object.keys(errors).length) return;

    setProfileSaveBusy(true);
    try {
      const result = await api('/auth/profile', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          name: studentProfile.name,
          pictureUrl: studentProfile.pictureUrl,
          university: studentProfile.university,
          academicYear: studentProfile.academicYear,
          graduationYear: studentProfile.graduationYear,
          bio: studentProfile.bio,
          programmingLanguages: studentProfile.programmingLanguages,
          technicalInterests: studentProfile.technicalInterests,
          cpStats: studentProfile.cpStats,
          icpcJourney: studentProfile.icpcJourney,
          teamStatus: studentProfile.teamStatus,
          teamPreferences: studentProfile.teamPreferences,
          trainingGoals: studentProfile.trainingGoals,
          trainingTopics: studentProfile.trainingTopics,
          milestones: studentProfile.milestones,
          trainingProgress: studentProfile.trainingProgress,
        }),
      });
      session.updateUser(result.user);
      setStudentProfile(studentProfileForm(result.user.profile, result.user.name));
      setProfileSaveSuccess('Your profile has been saved.');
    } catch (reason) {
      if (reason.field) setProfileFieldErrors((current) => ({ ...current, [reason.field]: reason.message }));
      setProfileSaveError(reason.message);
    } finally {
      setProfileSaveBusy(false);
    }
  };

  const saveConnections = async (event) => {
    event.preventDefault();
    const errors = {};
    [
      ['externalProfiles.githubUrl', studentProfile.externalProfiles.githubUrl],
      ['externalProfiles.linkedinUrl', studentProfile.externalProfiles.linkedinUrl],
      ['externalProfiles.codeforcesUrl', studentProfile.externalProfiles.codeforcesUrl],
    ].forEach(([field, value]) => {
      if (value && !safeExternalUrl(value)) errors[field] = 'Enter a valid HTTP or HTTPS URL.';
    });
    studentProfile.externalProfiles.otherProfiles.forEach((entry, index) => {
      if (entry.url && !safeExternalUrl(entry.url)) errors[`externalProfiles.otherProfiles.${index}.url`] = 'Enter a valid HTTP or HTTPS URL.';
    });
    setProfileFieldErrors(errors);
    setProfileSaveError('');
    setProfileSaveSuccess('');
    if (Object.keys(errors).length) return;

    setProfileSaveBusy(true);
    try {
      const result = await api('/auth/profile', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ externalProfiles: studentProfile.externalProfiles }),
      });
      session.updateUser(result.user);
      setStudentProfile((current) => ({
        ...current,
        externalProfiles: studentProfileForm(result.user.profile, result.user.name).externalProfiles,
      }));
      setProfileSaveSuccess('Your manually entered profiles have been saved.');
    } catch (reason) {
      if (reason.field) setProfileFieldErrors((current) => ({ ...current, [reason.field]: reason.message }));
      setProfileSaveError(reason.message);
    } finally {
      setProfileSaveBusy(false);
    }
  };

  const privacySettings = {
    profileVisible: true,
    externalProfilesVisible: true,
    cpStatsVisible: true,
    trainingVisible: true,
    teamStatusVisible: true,
    journeyVisible: true,
    ...(session.user.profile?.privacy || {}),
  };
  const updatePrivacy = async (field, value) => {
    setPrivacyBusy(true);
    setPrivacyError('');
    setPrivacySuccess('');
    try {
      const result = await api('/auth/privacy', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ [field]: value }),
      });
      session.updateUser(result.user);
      setPrivacySuccess('Privacy preference saved.');
    } catch (reason) {
      setPrivacyError(reason.message);
    } finally {
      setPrivacyBusy(false);
    }
  };

  const notificationPreferences = {
    contestAnnouncements: true,
    icpcEvents: true,
    ...(session.user.notificationPreferences || {}),
  };
  const updateNotificationPreference = async (field, value) => {
    setNotificationPreferenceBusy(true);
    setNotificationPreferenceError('');
    setNotificationPreferenceSuccess('');
    try {
      const result = await api('/auth/notification-preferences', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({ [field]: value }),
      });
      session.updateUser(result.user);
      setNotificationPreferenceSuccess('Notification preference saved.');
    } catch (reason) {
      setNotificationPreferenceError(reason.message);
    } finally {
      setNotificationPreferenceBusy(false);
    }
  };

  const logout = () => {
    session.signOut();
    navigate('/login', { replace: true });
  };

  if (!['account', 'profile', 'privacy', 'notifications', 'appearance', 'connections'].includes(section)) {
    return <Navigate to="/settings/account" replace />;
  }

  return (
    <main className="page-wrap settings-page">
      <div className="page-heading"><span className="eyebrow">YOUR COMMUNITY</span><h1>Settings<span>.</span></h1><p>Manage your account, profile, privacy, and preferences.</p></div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            ['account', 'Account', UserRound],
            ['profile', 'Profile', UserRound],
            ['privacy', 'Privacy', Shield],
            ['notifications', 'Notifications', Bell],
            ['appearance', 'Appearance', Palette],
            ['connections', 'Connections', Link2],
          ].map(([path, label, Icon]) => <Link key={path} className={section === path ? 'settings-nav-link active' : 'settings-nav-link'} to={`/settings/${path}`} aria-current={section === path ? 'page' : undefined}><Icon size={17} />{label}</Link>)}
        </nav>
        <div className="settings-content">
      {section === 'account' && <section className="settings-card settings-profile-card" aria-labelledby="settings-profile-title">
        <div className="settings-card-heading">
          <div className="profile-avatar settings-avatar" aria-hidden="true">{session.user.name.trim().charAt(0).toUpperCase()}</div>
          <div><span className="eyebrow">ACCOUNT</span><h2 id="settings-profile-title">{session.user.name}</h2></div>
        </div>
        <dl className="settings-profile-details">
          <div><dt>Username</dt><dd>{session.user.username || 'Not set'}</dd></div>
          <div><dt>Email address</dt><dd>{session.user.email}</dd></div>
          <div><dt>Student ID</dt><dd>{session.user.studentId || 'Not provided yet'}</dd></div>
          {session.user.createdAt && <div><dt>Account created</dt><dd>{new Date(session.user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>}
        </dl>
        <form className="student-id-form" onSubmit={saveUsername}>
          <label htmlFor="settings-username">Username<input id="settings-username" autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          {usernameError && <div className="notice error-notice" role="alert">{usernameError}</div>}
          <button className="button button-dark" type="submit" disabled={usernameBusy}>{usernameBusy ? 'Saving...' : 'Save username'} <ArrowRight size={16} /></button>
        </form>
        {!session.user.studentId && <form className="student-id-form" onSubmit={saveStudentId}>
          <StudentIdField id="settings-student-id" label="Add your student ID" value={studentId} onChange={(event) => setStudentId(event.target.value)} />
          <p>Student ID is optional and can only be added once.</p>
          {profileError && <div className="notice error-notice" role="alert">{profileError}</div>}
          <button className="button button-dark" type="submit" disabled={profileBusy}>{profileBusy ? 'Saving...' : 'Save student ID'} <ArrowRight size={16} /></button>
        </form>}
      </section>
      }
      {section === 'profile' && <form className="settings-card profile-editor" onSubmit={saveStudentProfile}>
        <span className="eyebrow">YOUR STUDENT PROFILE</span>
        <h2>Edit your profile</h2>
        <p>Your existing account name remains required; every other profile field is optional and can be updated later.</p>
        <fieldset>
          <legend>Basic information</legend>
          <label>Full name<input required maxLength="80" value={studentProfile.name} onChange={(event) => updateStudentProfileField('name', event.target.value)} aria-invalid={Boolean(profileFieldErrors.name)} /></label>
          {profileFieldErrors.name && <span className="field-error">{profileFieldErrors.name}</span>}
          <label>Profile picture URL<input type="text" inputMode="url" maxLength="500" value={studentProfile.pictureUrl} onChange={(event) => updateStudentProfileField('pictureUrl', event.target.value)} aria-invalid={Boolean(profileFieldErrors.pictureUrl)} /></label>
          {profileFieldErrors.pictureUrl && <span className="field-error">{profileFieldErrors.pictureUrl}</span>}
          <label>University<input maxLength="120" value={studentProfile.university} onChange={(event) => updateStudentProfileField('university', event.target.value)} /></label>
          <div className="profile-form-grid">
            <label>Academic year<input maxLength="40" placeholder="e.g. 3rd year" value={studentProfile.academicYear} onChange={(event) => updateStudentProfileField('academicYear', event.target.value)} /></label>
            <label>Graduation year<input type="number" min="1900" max="2200" value={studentProfile.graduationYear} onChange={(event) => updateStudentProfileField('graduationYear', event.target.value)} /></label>
          </div>
          <label>Short bio<textarea maxLength="500" rows="3" value={studentProfile.bio} onChange={(event) => updateStudentProfileField('bio', event.target.value)} /></label>
          <label>Programming languages <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile.programmingLanguages.join('\n')} onChange={(event) => updateStudentProfileField('programmingLanguages', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors.programmingLanguages)} /></label>
          {profileFieldErrors.programmingLanguages && <span className="field-error">{profileFieldErrors.programmingLanguages}</span>}
          <label>Technical interests <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile.technicalInterests.join('\n')} onChange={(event) => updateStudentProfileField('technicalInterests', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors.technicalInterests)} /></label>
          {profileFieldErrors.technicalInterests && <span className="field-error">{profileFieldErrors.technicalInterests}</span>}
        </fieldset>
        <fieldset>
          <legend>Competitive programming</legend>
          <p className="profile-field-hint">These values are self-reported and will be shown as unverified. No platform integration is connected.</p>
          <div className="profile-form-grid">
            <label>Platform<input maxLength="40" value={studentProfile.cpStats.platform} onChange={(event) => updateNestedProfileField('cpStats', 'platform', event.target.value)} /></label>
            <label>Handle<input maxLength="80" value={studentProfile.cpStats.handle} onChange={(event) => updateNestedProfileField('cpStats', 'handle', event.target.value)} /></label>
            {[
              ['problemsSolved', 'Problems solved'],
              ['contestsParticipated', 'Contests participated'],
              ['currentRating', 'Current rating'],
              ['highestRating', 'Highest rating'],
              ].map(([field, label]) => <label key={field}>{label}<input type="number" min="0" step="1" value={studentProfile.cpStats[field]} onChange={(event) => updateNestedProfileField('cpStats', field, event.target.value)} aria-invalid={Boolean(profileFieldErrors[`cpStats.${field}`])} />{profileFieldErrors[`cpStats.${field}`] && <span className="field-error">{profileFieldErrors[`cpStats.${field}`]}</span>}</label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>ICPC journey <span className="profile-field-hint">Entries are user-provided and unverified</span></legend>
          {studentProfile.icpcJourney.map((entry, index) => <div className="profile-journey-editor" key={`journey-${index}`}>
            <div className="profile-form-grid">
              {[
                ['contestName', 'Contest name'],
                ['season', 'Season'],
                ['stage', 'Stage'],
                ['result', 'Result'],
                ['teamName', 'Team name'],
                ['achievement', 'Achievement or award'],
              ].map(([field, label]) => <label key={field}>{label}<input maxLength={field === 'contestName' ? 120 : 160} value={entry[field] || ''} onChange={(event) => setStudentProfile((current) => ({ ...current, icpcJourney: current.icpcJourney.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item) }))} /></label>)}
            </div>
            <label>Teammates <span className="profile-field-hint">One per line</span><textarea rows="2" value={(entry.teammates || []).join('\n')} onChange={(event) => setStudentProfile((current) => ({ ...current, icpcJourney: current.icpcJourney.map((item, itemIndex) => itemIndex === index ? { ...item, teammates: event.target.value.split('\n').map((name) => name.trim()).filter(Boolean) } : item) }))} /></label>
            <button className="profile-remove-button" type="button" onClick={() => setStudentProfile((current) => ({ ...current, icpcJourney: current.icpcJourney.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={15} /> Remove entry</button>
          </div>)}
          <button className="button button-outline profile-add-button" type="button" onClick={() => setStudentProfile((current) => ({ ...current, icpcJourney: [...current.icpcJourney, { contestName: '', season: '', stage: '', result: '', teamName: '', teammates: [], achievement: '' }] }))}><Plus size={16} /> Add ICPC entry</button>
        </fieldset>
        <fieldset>
          <legend>Looking for a team</legend>
          <label>Team status<select value={studentProfile.teamStatus} onChange={(event) => updateStudentProfileField('teamStatus', event.target.value)}><option value="">Not specified</option><option value="looking">Looking for a team</option><option value="in_team">Already in a team</option><option value="not_looking">Not currently looking</option></select></label>
          {studentProfile.teamStatus === 'looking' && <div className="profile-form-grid">
            <label>Preferred programming language<input maxLength="40" value={studentProfile.teamPreferences.preferredLanguage} onChange={(event) => updateNestedProfileField('teamPreferences', 'preferredLanguage', event.target.value)} /></label>
            <label>Experience or approximate level<input maxLength="200" value={studentProfile.teamPreferences.experience} onChange={(event) => updateNestedProfileField('teamPreferences', 'experience', event.target.value)} /></label>
            <label>Preferred training schedule<input maxLength="120" value={studentProfile.teamPreferences.schedule} onChange={(event) => updateNestedProfileField('teamPreferences', 'schedule', event.target.value)} /></label>
            <label>Training preference<select value={studentProfile.teamPreferences.preference} onChange={(event) => updateNestedProfileField('teamPreferences', 'preference', event.target.value)}><option value="">Not specified</option><option value="online">Online</option><option value="offline">Offline</option><option value="either">Either</option></select></label>
            <label className="profile-form-wide">Introduction for potential teammates<textarea maxLength="300" rows="3" value={studentProfile.teamPreferences.introduction} onChange={(event) => updateNestedProfileField('teamPreferences', 'introduction', event.target.value)} /></label>
          </div>}
        </fieldset>
        <fieldset>
          <legend>Training goals</legend>
          {[
            ['trainingGoals', 'Current learning goals'],
            ['trainingTopics', 'Topics you are studying'],
            ['milestones', 'Personal milestones'],
          ].map(([field, label]) => <label key={field}>{label} <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile[field].join('\n')} onChange={(event) => updateStudentProfileField(field, event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors[field])} />{profileFieldErrors[field] && <span className="field-error">{profileFieldErrors[field]}</span>}</label>)}
          <label>Training progress<input maxLength="300" value={studentProfile.trainingProgress} onChange={(event) => updateStudentProfileField('trainingProgress', event.target.value)} aria-invalid={Boolean(profileFieldErrors.trainingProgress)} />{profileFieldErrors.trainingProgress && <span className="field-error">{profileFieldErrors.trainingProgress}</span>}</label>
        </fieldset>
        {profileSaveError && <div className="notice error-notice" role="alert">{profileSaveError}</div>}
        {profileSaveSuccess && <div className="notice success-notice" role="status">{profileSaveSuccess}</div>}
        <div className="profile-form-actions"><button className="button button-outline" type="button" onClick={cancelStudentProfile} disabled={profileSaveBusy}>Cancel</button><button className="button button-dark" type="submit" disabled={profileSaveBusy}>{profileSaveBusy ? 'Saving profile...' : 'Save changes'} <ArrowRight size={16} /></button></div>
      </form>}
      {section === 'connections' && <form className="settings-card profile-editor" onSubmit={saveConnections}>
        <span className="eyebrow">MANUALLY ENTERED PROFILES</span>
        <h2>Public profile links</h2>
        <p>These are public profile links and handles only. They are not authenticated account connections, and every field is optional.</p>
        <fieldset>
          <legend>Competitive and social profiles</legend>
          {[
            ['githubUrl', 'GitHub profile URL'],
            ['linkedinUrl', 'LinkedIn profile URL'],
            ['codeforcesUrl', 'Codeforces profile URL'],
          ].map(([field, label]) => {
            const key = `externalProfiles.${field}`;
            return <div key={field}>
              <label>{label}<input type="text" inputMode="url" maxLength="500" value={studentProfile.externalProfiles[field]} onChange={(event) => updateNestedProfileField('externalProfiles', field, event.target.value)} aria-invalid={Boolean(profileFieldErrors[key])} /></label>
              {profileFieldErrors[key] && <span className="field-error">{profileFieldErrors[key]}</span>}
            </div>;
          })}
          <label>Codeforces handle<input maxLength="40" value={studentProfile.externalProfiles.codeforcesHandle} onChange={(event) => updateNestedProfileField('externalProfiles', 'codeforcesHandle', event.target.value)} /></label>
          {studentProfile.externalProfiles.otherProfiles.map((entry, index) => <div className="profile-form-grid profile-other-link" key={`other-profile-${index}`}>
            <label>Platform<input maxLength="40" value={entry.platform} onChange={(event) => setStudentProfile((current) => ({ ...current, externalProfiles: { ...current.externalProfiles, otherProfiles: current.externalProfiles.otherProfiles.map((item, itemIndex) => itemIndex === index ? { ...item, platform: event.target.value } : item) } }))} /></label>
            <label>Profile URL<input type="text" inputMode="url" maxLength="500" value={entry.url} onChange={(event) => setStudentProfile((current) => ({ ...current, externalProfiles: { ...current.externalProfiles, otherProfiles: current.externalProfiles.otherProfiles.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) } }))} aria-invalid={Boolean(profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`])} /></label>
          </div>)}
          {studentProfile.externalProfiles.otherProfiles.map((entry, index) => profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`] && <span className="field-error" key={`other-profile-error-${index}`}>{profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`]}</span>)}
          <button className="button button-outline profile-add-button" type="button" onClick={() => setStudentProfile((current) => ({ ...current, externalProfiles: { ...current.externalProfiles, otherProfiles: [...current.externalProfiles.otherProfiles, { platform: '', url: '' }] } }))}><Plus size={16} /> Add another profile</button>
        </fieldset>
        {profileSaveError && <div className="notice error-notice" role="alert">{profileSaveError}</div>}
        {profileSaveSuccess && <div className="notice success-notice" role="status">{profileSaveSuccess}</div>}
        <div className="profile-form-actions"><button className="button button-outline" type="button" onClick={cancelStudentProfile} disabled={profileSaveBusy}>Cancel</button><button className="button button-dark" type="submit" disabled={profileSaveBusy}>{profileSaveBusy ? 'Saving...' : 'Save changes'} <ArrowRight size={16} /></button></div>
      </form>}
      {section === 'appearance' && <section className="settings-card settings-theme-card" aria-labelledby="settings-theme-title">
        <div><span className="eyebrow">APPEARANCE</span><h2 id="settings-theme-title">Theme</h2><p>Choose how the community looks on this device.</p></div>
        <div className="theme-options" role="group" aria-label="Color theme">
          <button type="button" className={theme === 'light' ? 'theme-option selected' : 'theme-option'} aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}><Sun size={18} /> Light Mode</button>
          <button type="button" className={theme === 'dark' ? 'theme-option selected' : 'theme-option'} aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}><Moon size={18} /> Dark Mode</button>
        </div>
      </section>}
      {section === 'account' && <form className="settings-card" onSubmit={submit}>
        <span className="settings-icon"><KeyRound size={21} /></span>
        <span className="eyebrow">ACCOUNT SECURITY</span>
        <h2>Change password</h2>
        <p>Enter your current password, then choose a new one with at least 8 characters.</p>
        <label>Current password<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength="8" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {success && <div className="notice success-notice" role="status">{success}</div>}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Updating password...' : 'Change password'} <ArrowRight size={16} /></button>
        <div className="settings-signout-divider">
          <button className="button button-outline settings-logout" type="button" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </form>}
      {section === 'privacy' && <section className="settings-card settings-privacy-card" aria-labelledby="settings-privacy-title">
        <span className="eyebrow">PUBLIC PROFILE</span>
        <h2 id="settings-privacy-title">Privacy</h2>
        <p>Choose which parts of your profile can be seen by people in the community. Your email and student ID are never shown publicly.</p>
        <div className="privacy-options">
          {[
            ['profileVisible', 'Public profile', 'Show your public profile page and list your name on the community leaderboard.'],
            ['externalProfilesVisible', 'External profile links', 'Show your manually entered GitHub, LinkedIn, Codeforces, and other profile links.'],
            ['cpStatsVisible', 'Competitive programming stats', 'Show self-reported platform ratings and counts. Verified community leaderboard points remain visible.'],
            ['trainingVisible', 'Training interests and goals', 'Show the topics, milestones, and training goals on your profile.'],
            ['teamStatusVisible', 'Team status and preferences', 'Show whether you are looking for a team and any preferences you shared.'],
            ['journeyVisible', 'ICPC journey and attendance history', 'Show self-reported ICPC journey entries and verified community event attendance.'],
          ].map(([key, label, description]) => <label className="privacy-option" key={key}>
            <span><strong>{label}</strong><small>{description}</small></span>
            <input type="checkbox" checked={Boolean(privacySettings[key])} disabled={privacyBusy} onChange={(event) => updatePrivacy(key, event.target.checked)} aria-label={label} />
          </label>)}
        </div>
        {privacyError && <div className="notice error-notice" role="alert">{privacyError}</div>}
        {privacySuccess && <div className="notice success-notice" role="status">{privacySuccess}</div>}
      </section>}
        {section === 'notifications' && <section className="settings-card settings-privacy-card" aria-labelledby="settings-notification-title">
          <span className="eyebrow">COMMUNITY UPDATES</span>
          <h2 id="settings-notification-title">Notifications</h2>
          <p>Choose which supported updates appear in your notification inbox. Essential account-security messages are not controlled here.</p>
          <div className="privacy-options">
            {[
              ['contestAnnouncements', 'Contest announcements', 'Newly published contest and competition events.'],
              ['icpcEvents', 'ICPC events', 'Newly published ICPC community events and important event updates.'],
            ].map(([key, label, description]) => <label className="privacy-option" key={key}>
              <span><strong>{label}</strong><small>{description}</small></span>
              <input type="checkbox" checked={Boolean(notificationPreferences[key])} disabled={notificationPreferenceBusy} onChange={(event) => updateNotificationPreference(key, event.target.checked)} aria-label={label} />
            </label>)}
          </div>
          {notificationPreferenceError && <div className="notice error-notice" role="alert">{notificationPreferenceError}</div>}
          {notificationPreferenceSuccess && <div className="notice success-notice" role="status">{notificationPreferenceSuccess}</div>}
        </section>}
        </div>
      </div>
    </main>
  );
}

function MyActivitiesPage({ token }) {
  const [items, setItems] = useState([]);
  const [standing, setStanding] = useState({ rank: null, points: 0, eventsAttended: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboardError, setLeaderboardError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setLeaderboardError('');
    Promise.allSettled([api('/events/my', { token }), api('/events/leaderboard/me', { token })])
      .then(([eventsResult, leaderboardResult]) => {
        if (!active) return;
        if (eventsResult.status === 'fulfilled') setItems(eventsResult.value.events);
        else setError(eventsResult.reason.message);
        if (leaderboardResult.status === 'fulfilled') {
          setStanding(leaderboardResult.value.standing);
          setAttendanceHistory(leaderboardResult.value.attendanceHistory);
        } else setLeaderboardError(leaderboardResult.reason.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey, token]);

  return (
    <main className="page-wrap">
      <div className="page-heading"><span className="eyebrow">YOUR COMMUNITY DASHBOARD</span><h1>My <span>Activities.</span></h1><p>Your registered events, joined roadmaps, and progress in one place.</p></div>
      <section className="my-activities-section" aria-labelledby="my-events-heading">
        <div className="my-activities-section-heading"><div><span className="eyebrow">YOUR LINEUP</span><h2 id="my-events-heading">My Events</h2></div><Link className="text-link" to="/">Explore events <ArrowRight size={15} /></Link></div>
        {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>}
        {loading ? <div className="empty-state"><span className="loader" /> Loading your events...</div> : error ? null : items.length ?
          <div className="my-event-list">{items.map((item, index) =>
            <article className="my-event-card" key={item.registrationId}>
              <div className={`my-event-date accent-${index % 4}`}><b>{new Date(item.event.startsAt).toLocaleDateString(undefined, { day: '2-digit' })}</b><span>{new Date(item.event.startsAt).toLocaleDateString(undefined, { month: 'short' })}</span></div>
              <div className="my-event-info"><span className="category-label">{item.event.category}</span><h3><Link to={`/events/${item.event.slug}`}>{item.event.title}</Link></h3><span>{eventDate(item.event.startsAt, { weekday: 'short', year: undefined })} · {item.event.mode === 'offline' ? item.event.location : 'Online'}</span></div>
              <div className="ticket-list-action">
                {item.checkedInAt
                  ? <span className="registered-badge"><Check size={16} /> Checked in · +{item.pointsAwarded} pts</span>
                  : <span className="check-status">Not checked in</span>}
                <Link className="button button-outline" to={`/events/${item.event.slug}`}><Ticket size={16} /> Event details</Link>
              </div>
            </article>,
          )}</div> :
          <div className="empty-state"><span className="empty-icon"><Ticket size={24} /></span><h3>Your next adventure is waiting.</h3><p>You haven’t registered for an event yet.</p><Link className="button button-dark" to="/">Explore events <ArrowRight size={16} /></Link></div>}
      </section>
      {!loading && <section className="personal-leaderboard">
        <div className="personal-leaderboard-heading"><span className="eyebrow"><Trophy size={15} /> YOUR CONTEST STATS</span><Link to="/leaderboard">Global rankings <ArrowRight size={15} /></Link></div>
        {leaderboardError && <div className="notice error-notice" role="alert">{leaderboardError}</div>}
        {!leaderboardError && <>
          <div className="personal-leaderboard-stats">
            <div><small>CURRENT RANK</small><strong>{standing.rank ? `#${standing.rank}` : '—'}</strong></div>
            <div><small>TOTAL POINTS</small><strong>{standing.points}</strong></div>
            <div><small>EVENTS ATTENDED</small><strong>{standing.eventsAttended}</strong></div>
          </div>
          <div className="personal-history">
            <h2>Attendance history</h2>
            {attendanceHistory?.length ? attendanceHistory.map((entry) => <div className="personal-history-row" key={`${entry.event.id}-${entry.checkedInAt}`}>
              <span><b>{entry.event.title}</b><small>{eventDate(entry.checkedInAt)}</small></span>
              <strong>+{entry.pointsAwarded} pts</strong>
            </div>) : <p>You’ll see attended events and earned points here.</p>}
          </div>
        </>}
      </section>}
      <MyRoadmapsSection token={token} />
    </main>
  );
}

function CheckInPage({ token, user }) {
  const { eventId } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [checkInWindow, setCheckInWindow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrToken = new URLSearchParams(location.search).get('token') || '';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/events/${encodeURIComponent(eventId)}`)
      .then(({ event: current }) => {
        if (active) setEvent(current);
        if (!token) return null;
        if (!qrToken) throw new Error('This check-in link is missing its event QR token.');
        return api(`/events/${encodeURIComponent(eventId)}/check-in?token=${encodeURIComponent(qrToken)}`, { token });
      })
      .then((result) => {
        if (!active || !result) return;
        setEvent(result.event);
        setAttendance(result.attendance);
        setCheckInWindow(result.checkInWindow);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [eventId, qrToken, token]);

  const checkIn = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api(`/events/${encodeURIComponent(eventId)}/check-in`, {
        method: 'POST',
        token,
        body: JSON.stringify({ token: qrToken }),
      });
      setAttendance(result.attendance);
      setSuccess(`${result.message} You earned ${result.attendance.pointsAwarded} points.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-wrap checkin-page">
      <Link className="back-link" to={user ? '/my-activities' : '/'}><ChevronLeft size={16} /> {user ? 'Back to My Activities' : 'All events'}</Link>
      {loading && <div className="empty-state"><span className="loader" /> Checking your event...</div>}
      {!loading && event && <article className="checkin-card">
        <div className="checkin-card-heading"><span className="eyebrow"><QrCode size={16} /> EVENT CHECK-IN</span><span className="category-label">{event.category}</span></div>
        <div className="checkin-card-content">
          <h1>{event.title}</h1>
          <div className="ticket-detail-grid">
            <div><CalendarDays size={18} /><span><b>{eventDate(event.startsAt)}</b><small>Event date</small></span></div>
            <div><MapPin size={18} /><span><b>{event.location || 'Online'}</b><small>Location</small></span></div>
          </div>
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          {success && <div className="notice success-notice" role="status">{success}</div>}
          {!user && <div className="notice checkin-login-notice">Sign in with your registered account to verify your eligibility and check in.</div>}
          {user && attendance?.checkedInAt && <div className="attendance-confirmed" role="status"><Check size={20} /><span><b>You’re checked in!</b><small>Attendance recorded · {attendance.pointsAwarded} points earned</small></span></div>}
          {user && attendance && !attendance.checkedInAt && <div className="checkin-window-note">
            {checkInWindow?.isOpen
              ? 'Your registration is confirmed. Check in now to record your attendance.'
              : `Check-in opens ${eventDate(checkInWindow.opensAt)} and closes ${eventDate(checkInWindow.closesAt)}.`}
          </div>}
          <div className="checkin-actions">
            {!user
              ? <Link className="button button-dark" to="/login" state={{ from: `${location.pathname}${location.search}` }}>Sign in to check in <ArrowRight size={17} /></Link>
              : attendance && !attendance.checkedInAt && <button className="button button-dark" disabled={busy || !checkInWindow?.isOpen} onClick={checkIn}>{busy ? 'Checking in...' : 'Confirm check-in'} <Check size={17} /></button>}
            <Link className="button button-outline" to={user ? '/my-activities' : `/events/${event.slug}`}>{user ? 'My Activities' : 'Event details'}</Link>
          </div>
        </div>
      </article>}
      {!loading && !event && <div className="notice error-notice" role="alert">{error || 'Event not found.'}</div>}
    </main>
  );
}

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/events/leaderboard')
      .then(({ leaderboard: results }) => setLeaderboard(results))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return <main className="page-wrap leaderboard-page">
    <div className="page-heading"><span className="eyebrow">SHOW UP. LEVEL UP.</span><h1>Community <span>leaderboard.</span></h1><p>Points are awarded for verified event attendance.</p></div>
    {error && <div className="notice error-notice">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading the leaderboard...</div> : leaderboard.length
      ? <section className="leaderboard-card"><div className="leaderboard-head"><span>RANK</span><span>MEMBER</span><span>EVENTS</span><span>POINTS</span></div>
        {leaderboard.map((member) => <div className="leaderboard-row" key={member.userId}><span className="leaderboard-rank">{String(member.rank).padStart(2, '0')}</span>{member.username ? <Link className="leaderboard-member-link" to={`/users/${member.username}`}>{member.name}</Link> : <span>{member.name}</span>}<span>{member.eventsAttended}</span><strong><Trophy size={16} /> {member.points}</strong></div>)}
      </section>
      : <div className="empty-state"><span className="empty-icon"><Trophy size={24} /></span><h3>The first points are up for grabs.</h3><p>Check in at an event to get on the leaderboard.</p></div>}
  </main>;
}

function NotificationsPage({ token }) {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'unread' ? '?filter=unread' : '';
      const result = await api(`/notifications${query}`, { token });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = async (notificationId) => {
    setBusy(true);
    setError('');
    try {
      await api(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH', token });
      await loadNotifications();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/notifications/read-all', { method: 'POST', token });
      await loadNotifications();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const openNotification = async (notification) => {
    if (!notification.readAt) await markRead(notification._id);
    navigate(notification.link);
  };

  return <main className="page-wrap notifications-page">
    <div className="page-heading"><span className="eyebrow">COMMUNITY UPDATES</span><h1>Notifications<span>.</span></h1><p>Contest announcements and ICPC community event updates.</p></div>
    <div className="notifications-toolbar">
      <div className="notification-filters" role="group" aria-label="Filter notifications">
        <button type="button" className={filter === 'all' ? 'notification-filter active' : 'notification-filter'} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
        <button type="button" className={filter === 'unread' ? 'notification-filter active' : 'notification-filter'} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread {unreadCount > 0 && <span>{unreadCount}</span>}</button>
      </div>
      {unreadCount > 0 && <button className="notification-mark-all" type="button" disabled={busy} onClick={markAllRead}>Mark all as read</button>}
    </div>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading notifications...</div>
      : notifications.length === 0 ? <div className="empty-state"><span className="empty-icon"><Bell size={24} /></span><h3>{filter === 'unread' ? 'You’re all caught up.' : 'No notifications yet.'}</h3><p>New contest and community event updates will show up here.</p></div>
        : <section className="notifications-list" aria-label="Notifications">{notifications.map((notification) => <article className={notification.readAt ? 'notifications-page-item' : 'notifications-page-item unread'} key={notification._id}>
          <div className="notifications-page-copy"><span className="notification-category-label">{notification.category === 'contest_announcement' ? 'Contest announcement' : 'ICPC event'}</span><h2>{notification.title}</h2><p>{notification.message}</p><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time></div>
          <div className="notifications-page-actions">
            {!notification.readAt && <button className="button button-outline notification-mark-read" type="button" disabled={busy} onClick={() => markRead(notification._id)}>Mark read</button>}
            <button className="button button-dark notification-open" type="button" disabled={busy} onClick={() => openNotification(notification)}>Open <ArrowRight size={15} /></button>
          </div>
        </article>)}</section>}
  </main>;
}

function UserProfilePage({ session }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/events/${encodeURIComponent(username)}/profile`)
      .then(({ profile: result }) => active && setProfile(result))
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username]);

  if (loading) return <main className="page-wrap"><div className="empty-state"><span className="loader" /> Loading member profile...</div></main>;
  if (error || !profile) return <main className="page-wrap"><div className="notice error-notice">{error || 'Member profile not found.'}</div><Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link></main>;

  const details = profile.profile || {};
  const externalProfiles = details.externalProfiles || {};
  const externalLinks = [
    ['GitHub', externalProfiles.githubUrl],
    ['LinkedIn', externalProfiles.linkedinUrl],
    ['Codeforces', externalProfiles.codeforcesUrl],
    ...(externalProfiles.otherProfiles || []).map((item) => [item.platform || 'Other profile', item.url]),
  ].map(([label, value]) => ({ label, url: safeExternalUrl(value) })).filter((item) => item.label && item.url);
  const cpStats = details.cpStats || {};
  const visibleStats = [
    ['Problems solved', cpStats.problemsSolved],
    ['Contests participated', cpStats.contestsParticipated],
    ['Current rating', cpStats.currentRating],
    ['Highest rating', cpStats.highestRating],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  const isOwner = session.user?.username && session.user.username === profile.username;

  return (
    <main className="page-wrap profile-page">
      <Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link>
      <section className="profile-card">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">{profile.name.trim().charAt(0).toUpperCase()}{safeExternalUrl(details.pictureUrl) && <img src={safeExternalUrl(details.pictureUrl)} alt="" onError={(event) => event.currentTarget.remove()} />}</div>
          <div className="profile-identity-copy"><span className="eyebrow">PUA ICPC COMMUNITY MEMBER</span><h1>{profile.name}</h1><p>{[details.university, details.academicYear, details.graduationYear ? `Class of ${details.graduationYear}` : ''].filter(Boolean).join(' · ') || `Member since ${new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}</p>{details.teamStatus && <span className="team-status-badge">{details.teamStatus === 'looking' ? 'Looking for a Team' : details.teamStatus === 'in_team' ? 'Already in a Team' : 'Not Looking for a Team'}</span>}</div>
          {isOwner && <Link className="button button-dark profile-edit-button" to="/settings/profile">Edit profile <ArrowRight size={15} /></Link>}
        </div>
        <div className="profile-stats">
          <div><small>LEADERBOARD RANK</small><strong>{profile.standing.rank ? `#${profile.standing.rank}` : '—'}</strong></div>
          <div><small>TOTAL POINTS</small><strong>{profile.standing.points}</strong></div>
          <div><small>EVENTS ATTENDED</small><strong>{profile.standing.eventsAttended}</strong></div>
        </div>
      </section>
      {(details.bio || details.programmingLanguages?.length || details.technicalInterests?.length) && <section className="profile-section">
        <h2>About</h2>
        {details.bio && <p className="profile-bio">{details.bio}</p>}
        {details.programmingLanguages?.length > 0 && <div className="profile-detail-row"><strong>Languages</strong><div className="profile-chip-list">{details.programmingLanguages.map((language) => <span className="profile-chip" key={language}>{language}</span>)}</div></div>}
        {details.technicalInterests?.length > 0 && <div className="profile-detail-row"><strong>Interests</strong><div className="profile-chip-list">{details.technicalInterests.map((interest) => <span className="profile-chip" key={interest}>{interest}</span>)}</div></div>}
      </section>}
      {externalLinks.length > 0 && <section className="profile-section">
        <h2>External profiles</h2>
        <div className="profile-external-links">{externalLinks.map(({ label, url }) => <a key={`${label}-${url}`} href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={14} /></a>)}</div>
        {externalProfiles.codeforcesHandle && <p className="profile-handle">Codeforces handle: <strong>{externalProfiles.codeforcesHandle}</strong></p>}
      </section>}
      {!externalLinks.length && externalProfiles.codeforcesHandle && <section className="profile-section"><h2>Competitive programming profile</h2><p className="profile-handle">Codeforces handle: <strong>{externalProfiles.codeforcesHandle}</strong></p></section>}
      {(visibleStats.length > 0 || cpStats.platform || cpStats.handle) && <section className="profile-section">
        <div className="profile-section-heading"><h2>Competitive programming</h2><span className="unverified-badge">Self-reported · Unverified</span></div>
        {(cpStats.platform || cpStats.handle) && <p className="profile-handle">{[cpStats.platform, cpStats.handle].filter(Boolean).join(' · ')}</p>}
        <div className="profile-cp-stats">{visibleStats.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      </section>}
      {details.icpcJourney?.length > 0 && <section className="profile-section">
        <div className="profile-section-heading"><h2>ICPC journey</h2><span className="unverified-badge">User-provided · Unverified</span></div>
        <div className="profile-journey-list">{details.icpcJourney.map((entry, index) => <article className="profile-journey-card" key={`${entry.contestName || 'contest'}-${entry.season || index}-${index}`}>
          <h3>{entry.contestName || 'ICPC participation'}</h3>
          <p>{[entry.season, entry.stage, entry.result].filter(Boolean).join(' · ')}</p>
          {entry.teamName && <p><strong>Team:</strong> {entry.teamName}</p>}
          {entry.teammates?.length > 0 && <p><strong>Teammates:</strong> {entry.teammates.join(', ')}</p>}
          {entry.achievement && <p><strong>Achievement:</strong> {entry.achievement}</p>}
        </article>)}</div>
      </section>}
      {details.teamStatus === 'looking' && details.teamPreferences && Object.values(details.teamPreferences).some(Boolean) && <section className="profile-section">
        <h2>Team preferences</h2>
        <div className="profile-public-details">
          {details.teamPreferences.preferredLanguage && <p><strong>Preferred language:</strong> {details.teamPreferences.preferredLanguage}</p>}
          {details.teamPreferences.experience && <p><strong>Experience:</strong> {details.teamPreferences.experience}</p>}
          {details.teamPreferences.schedule && <p><strong>Training schedule:</strong> {details.teamPreferences.schedule}</p>}
          {details.teamPreferences.preference && <p><strong>Training preference:</strong> {details.teamPreferences.preference}</p>}
          {details.teamPreferences.introduction && <p>{details.teamPreferences.introduction}</p>}
        </div>
      </section>}
      {(details.trainingGoals?.length || details.trainingTopics?.length || details.milestones?.length || details.trainingProgress) && <section className="profile-section">
        <h2>Training goals</h2>
        {details.trainingGoals?.length > 0 && <div className="profile-detail-row"><strong>Goals</strong><div className="profile-chip-list">{details.trainingGoals.map((goal) => <span className="profile-chip" key={goal}>{goal}</span>)}</div></div>}
        {details.trainingTopics?.length > 0 && <div className="profile-detail-row"><strong>Studying</strong><div className="profile-chip-list">{details.trainingTopics.map((topic) => <span className="profile-chip" key={topic}>{topic}</span>)}</div></div>}
        {details.milestones?.length > 0 && <div className="profile-detail-row"><strong>Milestones</strong><div className="profile-chip-list">{details.milestones.map((milestone) => <span className="profile-chip" key={milestone}>{milestone}</span>)}</div></div>}
        {details.trainingProgress && <p className="profile-bio">{details.trainingProgress}</p>}
      </section>}
      {profile.attendanceHistory && <section className="profile-history">
        <div className="profile-history-heading"><span className="eyebrow"><CalendarDays size={15} /> ATTENDANCE HISTORY</span></div>
        {profile.attendanceHistory.length ? profile.attendanceHistory.map((entry) => (
          <article className="profile-history-row" key={`${entry.event.id}-${entry.checkedInAt}`}>
            <div><span className="category-label">{entry.event.category}</span><h2><Link to={`/events/${entry.event.slug}`}>{entry.event.title}</Link></h2><small>{eventDate(entry.checkedInAt)} · {entry.event.location || 'Online'}</small></div>
            <strong><Trophy size={15} /> +{entry.pointsAwarded} pts</strong>
          </article>
        )) : <div className="profile-empty-history"><p>No event attendance recorded yet.</p><Link className="button button-dark" to="/">Explore events <ArrowRight size={16} /></Link></div>}
      </section>}
    </main>
  );
}

function EventForm({ token, event, onSaved, onCancel }) {
  const [form, setForm] = useState(event ? {
    title: event.title, description: event.description, category: event.category,
    startsAt: dateTimeLocal(event.startsAt), endsAt: dateTimeLocal(event.endsAt),
    registrationDeadline: dateTimeLocal(event.registrationDeadline),
    attendancePoints: event.attendancePoints ?? 0,
    mode: event.mode, location: event.location || '', capacity: event.capacity ?? '', status: event.status,
  } : { title: '', description: '', category: 'Training', startsAt: '', endsAt: '', registrationDeadline: '', attendancePoints: 0, mode: 'online', location: '', capacity: '', status: 'draft' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      ...form,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      registrationDeadline: form.registrationDeadline || null,
      attendancePoints: Number(form.attendancePoints),
    };
    try {
      await api(event ? `/admin/events/${event.id}` : '/admin/events', { method: event ? 'PUT' : 'POST', token, body: JSON.stringify(body) });
      onSaved();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };

  return <form className="admin-form" onSubmit={submit}>
    <h2>{event ? 'Edit event' : 'Create an event'}</h2>
    <div className="form-grid">
      <label className="span-two">Event title<input required maxLength="140" value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
      <label>Category<input required value={form.category} onChange={(e) => update('category', e.target.value)} /></label>
      <label>Format<select value={form.mode} onChange={(e) => update('mode', e.target.value)}><option value="online">Online</option><option value="offline">In person</option></select></label>
      <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(e) => update('startsAt', e.target.value)} /></label>
      <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={(e) => update('endsAt', e.target.value)} /></label>
      <label>Attendance points<input type="number" min="0" step="any" required value={form.attendancePoints} onChange={(e) => update('attendancePoints', e.target.value)} /><small>Earned once after a verified check-in; past awards stay unchanged.</small></label>
      {form.mode === 'offline' && <label className="span-two">Location<input required value={form.location} onChange={(e) => update('location', e.target.value)} /></label>}
      <label>Registration deadline (optional)<input type="datetime-local" value={form.registrationDeadline} onChange={(e) => update('registrationDeadline', e.target.value)} /></label>
      <label>Capacity (optional)<input type="number" min="1" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} /></label>
      <label>Status<select value={form.status} onChange={(e) => update('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select><small>Only published events appear on the homepage and public Events page.</small></label>
      <label className="span-two">Description<textarea required rows="4" value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
    </div>
    {error && <div className="notice error-notice">{error}</div>}
    <div className="form-actions"><button className="button button-dark" disabled={busy}>{busy ? 'Saving...' : event ? 'Save changes' : 'Create event'}</button><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button></div>
  </form>;
}

function dateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Admin({ token }) {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [confirmationName, setConfirmationName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [qrDisplay, setQrDisplay] = useState(null);
  const [qrLoadingId, setQrLoadingId] = useState('');
  const [qrError, setQrError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { events: result } = await api('/admin/events', { token });
      setEvents(result);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => { loadEvents(); }, [loadEvents]);
  const loadAttendees = async (event) => {
    setSelected(event);
    try {
      const { registrations } = await api(`/admin/events/${event.id}/registrations`, { token });
      setAttendees(registrations);
    } catch (reason) { setError(reason.message); }
  };
  const generateEventQr = async (event) => {
    setQrLoadingId(event.id);
    setQrError('');
    try {
      const result = await api(`/admin/events/${event.id}/check-in-qr`, { method: 'POST', token });
      setQrDisplay(result);
    } catch (reason) {
      setQrError(reason.message);
    } finally {
      setQrLoadingId('');
    }
  };
  const deleteEvent = async (event) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api(`/admin/events/${event.id}`, {
        method: 'DELETE',
        token,
        body: JSON.stringify({ confirmationName }),
      });
      setEventToDelete(null);
      setConfirmationName('');
      setQrDisplay((current) => current?.event.id === event.id ? null : current);
      if (selected?.id === event.id) setSelected(event.status === 'deleted' ? null : event);
      await loadEvents();
    } catch (reason) {
      setDeleteError(reason.message);
    } finally {
      setDeleting(false);
    }
  };
  const closeDeleteDialog = () => {
    if (deleting) return;
    setEventToDelete(null);
    setConfirmationName('');
    setDeleteError('');
  };

  if (editing !== undefined) return <main className="page-wrap"><EventForm token={token} event={editing} onSaved={() => { setEditing(undefined); loadEvents(); }} onCancel={() => setEditing(undefined)} /></main>;

  return (
    <main className="page-wrap admin-page">
      <div className="page-heading admin-heading"><div><span className="eyebrow">THE CONTROL ROOM</span><h1>Event <span>admin.</span></h1><p>Make good things happen.</p></div><button className="button button-dark" onClick={() => setEditing(null)}>+ Create event</button></div>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      <div className="admin-grid">
        <section className="admin-panel"><h2>All events <span>{events.length}</span></h2>
          {loading ? <p className="muted">Loading events...</p> : events.map((event) => <div className="admin-event-row" key={event.id}><div><b>{event.title}</b><span>{eventDate(event.startsAt)} · {event.attendanceCount || 0}/{event.registrationCount} attended · {event.totalPointsAwarded || 0} pts awarded · {event.attendancePoints ?? 0} pts per attendee</span></div><span className={`status-pill status-${event.status}`}>{event.status}</span><div className="admin-row-actions"><button className="small-button" disabled={event.status === 'deleted'} onClick={() => setEditing(event)}>Edit</button><button className="small-button" onClick={() => loadAttendees(event)}>Attendees</button><button className="small-button" disabled={event.status !== 'published' || qrLoadingId === event.id} onClick={() => generateEventQr(event)}>{qrLoadingId === event.id ? 'Generating...' : 'Event QR'}</button><button className="small-button delete-event-button" disabled={event.status === 'deleted'} onClick={() => { setEventToDelete(event); setConfirmationName(''); setDeleteError(''); }}>Delete</button></div></div>)}
          {!loading && !events.length && <p className="muted">No events yet. Create your first event.</p>}
          {qrError && <div className="notice error-notice">{qrError}</div>}
        </section>
        <section className="admin-panel">
          <h2>Attendance <Users size={18} /></h2>
          {!selected && <p className="muted">Choose attendees on an event to review attendance and points.</p>}
          {selected && <div className="attendee-list"><h3>{selected.title} <span>{attendees.length} people</span></h3><p className="attendance-summary">{attendees.filter((item) => item.checkedInAt).length} attended · {attendees.reduce((total, item) => total + (item.pointsAwarded || 0), 0)} total points awarded</p>{attendees.map((attendee) => <div className="attendee-row" key={attendee.id}><div><b>{attendee.user.name}</b><span>{attendee.user.email}</span></div><span className={attendee.checkedInAt ? 'check-status done' : 'check-status'}>{attendee.checkedInAt ? `${eventDate(attendee.checkedInAt)} · ${attendee.pointsAwarded} pts` : 'Registered'}</span></div>)}</div>}
        </section>
      </div>
      {qrDisplay && <div className="qr-display-overlay" role="dialog" aria-modal="true" aria-labelledby="qr-display-title">
        <div className="qr-display">
          <button className="qr-display-close" aria-label="Close event QR" onClick={() => setQrDisplay(null)}><X size={22} /></button>
          <span className="eyebrow"><QrCode size={17} /> STUDENT CHECK-IN</span>
          <h2 id="qr-display-title">{qrDisplay.event.title}</h2>
          <img src={qrDisplay.qrCodeDataUrl} alt={`Event check-in QR code for ${qrDisplay.event.title}`} />
          <p>Students scan this code with their phones and sign in to record attendance.</p>
          <span className="qr-display-window">Check-in: {eventDate(qrDisplay.checkInWindow.opensAt)} – {eventDate(qrDisplay.checkInWindow.closesAt)}</span>
          <button className="button button-outline" onClick={() => generateEventQr(qrDisplay.event)}>Replace QR code</button>
        </div>
      </div>}
      {eventToDelete && <div className="qr-display-overlay delete-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <form className="delete-event-dialog" onSubmit={(e) => { e.preventDefault(); deleteEvent(eventToDelete); }}>
          <button type="button" className="qr-display-close" aria-label="Cancel event deletion" disabled={deleting} onClick={closeDeleteDialog}><X size={22} /></button>
          <span className="eyebrow">CONFIRM EVENT DELETION</span>
          <h2 id="delete-dialog-title">Delete this event?</h2>
          <p><b>{eventToDelete.title}</b> will be removed from public events and its check-in QR will stop working. Existing attendance and awarded points will be preserved.</p>
          <label htmlFor="delete-event-confirmation">Type the event name to continue</label>
          <input id="delete-event-confirmation" autoComplete="off" value={confirmationName} onChange={(e) => setConfirmationName(e.target.value)} placeholder={eventToDelete.title} required />
          {deleteError && <div className="notice error-notice" role="alert">{deleteError}</div>}
          <div className="delete-dialog-actions"><button type="button" className="button button-outline" disabled={deleting} onClick={closeDeleteDialog}>Cancel</button><button className="button delete-confirm-button" disabled={deleting || confirmationName !== eventToDelete.title}>{deleting ? 'Deleting...' : 'Delete event'}</button></div>
        </form>
      </div>}
    </main>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
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
          <span>Built for curious minds and problem solvers.</span>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href="https://chat.whatsapp.com/DYx4tz7Y2xnE8GJ1D8S6xn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the PUA ICPC Community WhatsApp group"
      title="Join our WhatsApp community"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16.04 3.2A12.72 12.72 0 0 0 5.1 22.4L3.4 28.6l6.35-1.67A12.72 12.72 0 1 0 16.04 3.2Zm0 23.2c-2 0-3.96-.54-5.68-1.57l-.4-.24-3.77.99 1-3.67-.26-.42a10.45 10.45 0 1 1 9.1 4.91Zm5.74-7.83c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.15-.7.16-.2.31-.8 1-.98 1.2-.18.2-.36.23-.67.08-.31-.16-1.31-.49-2.49-1.54-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.64.14-.14.31-.36.46-.54.15-.18.2-.31.3-.51.1-.2.05-.39-.03-.54-.08-.16-.7-1.69-.96-2.31-.25-.6-.51-.52-.7-.53l-.6-.01c-.2 0-.54.08-.82.39-.28.31-1.07 1.05-1.07 2.56 0 1.51 1.1 2.97 1.25 3.18.15.2 2.16 3.3 5.23 4.62.73.31 1.3.5 1.75.64.74.24 1.41.2 1.94.12.59-.09 1.83-.75 2.09-1.48.26-.73.26-1.36.18-1.49-.08-.13-.28-.2-.59-.36Z" fill="currentColor" />
      </svg>
    </a>
  );
}

export default function App() {
  const session = useSession();
  const [theme, setTheme] = useState(() => localStorage.getItem('pua-theme') === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pua-theme', theme);
  }, [theme]);
  return (
    <div className="app-shell">
      <Header user={session.user} onSignOut={session.signOut} token={session.token} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetail token={session.token} user={session.user} />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        <Route path="/roadmaps/cycles/:cycleId" element={<RoadmapCyclePage token={session.token} user={session.user} />} />
        <Route path="/roadmaps/check-in/:sessionId" element={<RequireUsername session={session}><RoadmapCheckInPage token={session.token} /></RequireUsername>} />
        <Route path="/roadmaps/:slug" element={<RoadmapDetailsPage token={session.token} user={session.user} />} />
        <Route path="/check-in/:eventId" element={session.loading ? <div className="empty-state"><span className="loader" /> Loading your account...</div> : <CheckInPage token={session.token} user={session.user} />} />
        <Route path="/login" element={<AuthPage session={session} />} />
        <Route path="/onboarding/username" element={session.loading ? <div className="empty-state"><span className="loader" /> Loading your account...</div> : session.user ? <UsernameSetupPage session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/my-activities" element={<RequireUsername session={session}><MyActivitiesPage token={session.token} /></RequireUsername>} />
        <Route path="/my-events" element={<Navigate to="/my-activities" replace />} />
        <Route path="/my-roadmaps" element={<Navigate to="/my-activities" replace />} />
        <Route path="/notifications" element={<RequireUsername session={session}><NotificationsPage token={session.token} /></RequireUsername>} />
        <Route path="/settings" element={<RequireUsername session={session}><Navigate to="/settings/account" replace /></RequireUsername>} />
        <Route path="/settings/:section" element={<RequireUsername session={session}><SettingsPage session={session} theme={theme} onThemeChange={setTheme} /></RequireUsername>} />
        <Route path="/resources" element={<Navigate to="/" replace />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/users/:username" element={<UserProfilePage session={session} />} />
        <Route path="/admin" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="events"><Admin token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/overview" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="overview"><AdminOverviewPage token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/events" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="events"><Admin token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/roadmaps/*" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="roadmaps"><AdminRoadmapsPage token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="*" element={<main className="page-wrap"><div className="empty-state"><h3>That page wandered off.</h3><Link className="button button-dark" to="/">Back to events</Link></div></main>} />
      </Routes>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
