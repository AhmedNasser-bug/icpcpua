import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Code2, MapPin, QrCode, Search, Trophy, Users } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { MyRoadmapsSection } from "../../roadmaps/pages/RoadmapsPages.jsx";
function EventCard({
  event,
  index
}) {
  return <article className={`event-card accent-${index % 4}`}>
      {event.coverImageUrl && <img className="event-card-cover" src={event.coverImageUrl} alt="" onError={e => e.currentTarget.remove()} />}
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
    </article>;
}
function HomeEventCarouselCard({
  event,
  index,
  now
}) {
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt).getTime();
  const isUpcoming = startsAt > now;
  const isOngoing = startsAt <= now && endsAt > now;
  const registrationOpen = isUpcoming && event.status === 'published' && (!event.registrationDeadline || new Date(event.registrationDeadline).getTime() > now) && (!event.capacity || event.registrationCount < event.capacity);
  return <article className={`home-featured-event accent-${event.category.length % 4}`}>
      <div className="home-event-banner" aria-label={`${event.category} event banner`}>
        {event.coverImageUrl && <img className="home-event-banner-cover" src={event.coverImageUrl} alt="" onError={e => e.currentTarget.remove()} />}
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
    </article>;
}
function AcpcCountdown() {
  const configuredTarget = import.meta.env.VITE_ACPC_TARGET_DATE;
  const targetValue = configuredTarget || '2027-08-01T00:00:00+03:00';
  const targetTime = Date.parse(targetValue);
  const [now, setNow] = useState(() => Date.now());
  const targetLabel = Number.isFinite(targetTime) && configuredTarget ? new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(targetTime) : configuredTarget ? 'configured date' : 'August 2027';
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
  const values = [['Days', Math.floor(remainingSeconds / 86400)], ['Hours', Math.floor(remainingSeconds % 86400 / 3600)], ['Minutes', Math.floor(remainingSeconds % 3600 / 60)], ['Seconds', remainingSeconds % 60]];
  return <>
    <div className="acpc-countdown" aria-label={`Countdown to ${targetLabel}: ${values.map(([unit, value]) => `${value} ${unit}`).join(', ')}`}>
      {values.map(([unit, value]) => <div className="acpc-countdown-unit" key={unit}><strong>{String(value).padStart(2, '0')}</strong><span>{unit}</span></div>)}
    </div>
  </>;
}
export function HomePage() {
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
        const result = await api('/events?sort=latest', {
          cache: 'no-store'
        });
        if (!active) return;
        const currentTime = Date.now();
        const latestEvents = [...new Map(result.events.map(event => [event.id, event])).values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        const currentEventId = eventsRef.current[activeEventIndexRef.current]?.id;
        const nextIndex = latestEvents.findIndex(event => event.id === currentEventId);
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
    setActiveEventIndex(index => events.length ? index % events.length : 0);
  }, [events.length]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (!carouselHovered && events.length > 1) setActiveEventIndex(index => (index + 1) % events.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [carouselHovered, events.length]);
  const goToEvent = direction => {
    setActiveEventIndex(index => (index + direction + events.length) % events.length);
  };
  const handleTouchStart = event => {
    touchStartX.current = event.changedTouches[0].clientX;
  };
  const handleTouchEnd = event => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) >= 45 && events.length > 1) goToEvent(delta < 0 ? 1 : -1);
  };
  return <main className="home-page">
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <h1>ICPC PUA — <span>Road to ICPC</span></h1>
          <p className="home-hero-lead">Building the next generation of problem solvers</p>
          <p className="home-hero-mission">Our goal is to help the first team from our university qualify for the ACPC</p>
          <div className="home-hero-actions">
            <Link className="button button-dark" to="/roadmaps">Start your journey <ArrowRight size={17} /></Link>
            <Link className="button button-outline" to="/events">Explore events <ArrowRight size={17} /></Link>
          </div>
        </div>
        <aside className="home-countdown-panel" aria-label="Countdown to our estimated ACPC target">
          <span className="eyebrow">THE ROAD AHEAD</span>
          <h2>Every day brings us closer to ACPC</h2>
          <AcpcCountdown />
        </aside>
      </div>
    </section>

    <section className="home-events-section" aria-labelledby="home-events-title">
      <div className="home-section-heading">
        <div><h2 id="home-events-title">Our <span>Events</span></h2></div>
        <div className="home-carousel-actions">
          <button className="home-carousel-control" type="button" aria-label="Previous event" onClick={() => goToEvent(-1)} disabled={events.length < 2}><ChevronLeft size={20} /></button>
          <button className="home-carousel-control" type="button" aria-label="Next event" onClick={() => goToEvent(1)} disabled={events.length < 2}><ChevronRight size={20} /></button>
          <Link className="text-link" to="/events">All events <ArrowRight size={15} /></Link>
        </div>
      </div>
      {eventsError && <div className="notice error-notice" role="alert">{eventsError} <Link className="text-link" to="/events">Browse events</Link></div>}
      {loadingEvents ? <div className="empty-state"><span className="loader" /> Loading events...</div> : events.length ? <>
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
        <div className="home-section-copy"><h2>Our <span>Roadmap</span></h2><p>Build problem-solving skills one step at a time with structured learning paths that help you keep moving.</p><Link className="button button-dark" to="/roadmaps">Explore roadmaps <ArrowRight size={16} /></Link></div>
        <div className="home-roadmap-visual" aria-hidden="true"><div className="home-roadmap-node"><span>01</span><b>Learn</b></div><div className="home-roadmap-node"><span>02</span><b>Practice</b></div><div className="home-roadmap-node"><span>03</span><b>Compete</b></div></div>
      </div>
    </section>

    <section className="home-training-section">
      <div className="home-section-inner home-split-layout home-training-layout">
        <div className="home-training-visual" aria-hidden="true"><div className="home-training-board"><span>while (curious) {'{'}</span><b>solve();</b><span>{'}'}</span></div></div>
        <div className="home-section-copy"><h2>Our <span>Training</span></h2><p>Competitive programming is a team effort. Join a guided cycle, practice with a cohort, and prepare alongside students who share your ambition.</p><Link className="button button-dark" to="/training">Explore Training <ArrowRight size={16} /></Link></div>
      </div>
    </section>

    <section className="home-goal-section">
      <div className="home-section-inner">
        <div className="home-goal-heading"><h2>One University. One Goal. <span>ACPC</span></h2><p>We are working toward our first PUA team qualifying for ACPC. Every practice session, solved problem, and competition is another step toward that goal.</p></div>
        <ol className="home-goal-timeline">
          <li><span>01</span><div><strong>Build the fundamentals</strong><p>Strengthen problem-solving foundations together.</p></div></li>
          <li><span>02</span><div><strong>Practice consistently</strong><p>Turn learning into a regular habit.</p></div></li>
          <li><span>03</span><div><strong>Grow as a team</strong><p>Develop collaboration and contest skills.</p></div></li>
          <li><span>04</span><div><strong>Prepare for qualification</strong><p>Work toward PUA’s first ACPC-qualified team.</p></div></li>
        </ol>
      </div>
    </section>
  </main>;
}
export function EventsPage() {
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
    api(`/events?${params}`).then(({
      events: result
    }) => {
      if (!active) return;
      setEvents(result);
      setCategories(current => [...new Set([...current, ...result.map(event => event.category)])].sort());
    }).catch(reason => active && setError(reason.message)).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, query, category]);
  return <main className="events-page">
      <section className="events-section" id="events">
        <div className="section-heading">
          <div><h1>Our <span>Events</span></h1></div>
          <div className="event-tabs" role="tablist">
            <button className={status === 'upcoming' ? 'tab active' : 'tab'} onClick={() => setStatus('upcoming')}>Upcoming</button>
            <button className={status === 'past' ? 'tab active' : 'tab'} onClick={() => setStatus('past')}>Past events</button>
          </div>
        </div>
        <div className="filter-row">
          <label className="search-box"><Search size={18} /><input aria-label="Search events" placeholder="Search events..." value={query} onChange={event => setQuery(event.target.value)} /></label>
          <select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        {error && <div className="notice error-notice">{error}</div>}
        {loading ? <div className="empty-state"><span className="loader" /> Loading events...</div> : events.length ? <div className="event-grid">{events.map((event, index) => <EventCard key={event.id} event={event} index={index} />)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays size={24} /></span><h3>No events found</h3><p>Try a different search or check back soon for new events</p></div>}
      </section>
      <section className="community-strip"><div className="strip-icon"><Users size={21} /></div><div><b>Better together</b><span>New to competitive programming? This is your place to start</span></div><Link to="/login">Meet the community <ArrowRight size={16} /></Link></section>
    </main>;
}
export function EventDetail({
  token,
  user
}) {
  const {
    eventId
  } = useParams();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const load = useCallback(async () => {
    const [{
      event: current
    }, mine] = await Promise.all([api(`/events/${encodeURIComponent(eventId)}`), token ? api('/events/my', {
      token
    }) : Promise.resolve({
      events: []
    })]);
    setEvent(current);
    setRegistered(mine.events.some(item => item.event.id === current.id));
  }, [eventId, token]);
  useEffect(() => {
    load().catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, [load]);
  const register = async () => {
    if (!token) return navigate('/login', {
      state: {
        from: `/events/${eventId}`
      }
    });
    setBusy(true);
    setMessage('');
    try {
      await api(`/events/${event.id}/registrations`, {
        method: 'POST',
        token
      });
      setRegistered(true);
      await load();
      setMessage('You’re registered! Your event is waiting in My Activities.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    setBusy(true);
    setMessage('');
    try {
      await api(`/events/${event.id}/registrations`, {
        method: 'DELETE',
        token
      });
      setRegistered(false);
      await load();
      setMessage('Your registration has been cancelled.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <div className="page-wrap"><div className="empty-state"><span className="loader" /> Loading event...</div></div>;
  if (!event) return <div className="page-wrap"><div className="notice error-notice">{message || 'Event not found.'}</div><Link className="text-link" to="/">Back to events</Link></div>;
  const closed = event.status !== 'published' || new Date(event.startsAt) <= new Date() || event.registrationDeadline && new Date(event.registrationDeadline) <= new Date() || event.capacity && event.registrationCount >= event.capacity;
  return <main className="page-wrap">
      <Link className="back-link" to="/"><ChevronLeft size={16} /> All events</Link>
      <article className="detail-card">
        <div className={`detail-banner accent-${event.category.length % 4}`}>
          {event.coverImageUrl && <img className="detail-banner-cover" src={event.coverImageUrl} alt="" onError={e => e.currentTarget.remove()} />}
          <span className="category-label">{event.category}</span>
          <span className="detail-decoration"><Code2 size={54} /></span>
        </div>
        <div className="detail-content">
          <div className="card-topline"><span className="event-mode">{event.mode === 'offline' ? 'IN PERSON' : 'ONLINE'}</span><span className={closed ? 'availability closed' : 'availability'}>{closed ? 'REGISTRATION CLOSED' : 'REGISTRATION OPEN'}</span></div>
          <h1>{event.title}</h1>
          <div className="detail-meta">
            <div><CalendarDays size={18} /><span><b>{eventDate(event.startsAt)}</b><small>Event date</small></span></div>
            <div><Clock3 size={18} /><span><b>{eventDate(event.endsAt, {
                  hour: 'numeric',
                  minute: '2-digit'
                })}</b><small>Ends</small></span></div>
            <div><MapPin size={18} /><span><b>{event.mode === 'offline' ? event.location : 'Online'}</b><small>Location</small></span></div>
          </div>
          <p className="detail-description">{event.description}</p>
          {event.capacity && <p className="spots-note">{event.registrationCount} of {event.capacity} spots taken</p>}
          <p className="points-note"><Trophy size={16} /> {event.attendancePoints ?? 0} attendance points</p>
          {message && <div className={`notice ${message.includes('registered') || message.includes('cancelled') ? 'success-notice' : 'error-notice'}`}>{message}</div>}
          <div className="detail-actions">
            {registered ? <><span className="registered-badge"><Check size={17} /> You’re registered</span><button className="button button-outline" disabled={busy || closed} onClick={cancel}>Cancel registration</button></> : <button className="button button-dark" disabled={busy || closed} onClick={register}>{busy ? 'Please wait...' : closed ? 'Registration closed' : 'Register for this event'} <ArrowRight size={17} /></button>}
            {user && <Link className="text-link" to="/my-activities">My Activities</Link>}
          </div>
        </div>
      </article>
    </main>;
}
export function MyActivitiesPage({
  token
}) {
  const [standing, setStanding] = useState({
    rank: null,
    points: 0,
    eventsAttended: 0
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLeaderboardError('');
    api('/events/leaderboard/me', {
      token
    }).then(leaderboardResult => {
      if (!active) return;
      setStanding(leaderboardResult.standing);
      setAttendanceHistory(leaderboardResult.attendanceHistory);
    }).catch(reason => {
      if (active) setLeaderboardError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey, token]);
  return <main className="page-wrap">
      <div className="page-heading"><h1>My <span>Activities</span></h1></div>
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
            {attendanceHistory?.length ? attendanceHistory.map(entry => <div className="personal-history-row" key={`${entry.event.id}-${entry.checkedInAt}`}>
              <span><b>{entry.event.title}</b><small>{eventDate(entry.checkedInAt)}</small></span>
              <strong>+{entry.pointsAwarded} pts</strong>
            </div>) : <p>You’ll see attended events and earned points here.</p>}
          </div>
        </>}
      </section>}
      <MyRoadmapsSection token={token} />
    </main>;
}
export function CheckInPage({
  token,
  user
}) {
  const {
    eventId
  } = useParams();
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
    api(`/events/${encodeURIComponent(eventId)}`).then(({
      event: current
    }) => {
      if (active) setEvent(current);
      if (!token) return null;
      if (!qrToken) throw new Error('This check-in link is missing its event QR token.');
      return api(`/events/${encodeURIComponent(eventId)}/check-in?token=${encodeURIComponent(qrToken)}`, {
        token
      });
    }).then(result => {
      if (!active || !result) return;
      setEvent(result.event);
      setAttendance(result.attendance);
      setCheckInWindow(result.checkInWindow);
    }).catch(reason => setError(reason.message)).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId, qrToken, token]);
  const checkIn = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api(`/events/${encodeURIComponent(eventId)}/check-in`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          token: qrToken
        })
      });
      setAttendance(result.attendance);
      setSuccess(`${result.message} You earned ${result.attendance.pointsAwarded} points.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  return <main className="page-wrap checkin-page">
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
            {checkInWindow?.isOpen ? 'Your registration is confirmed. Check in now to record your attendance.' : `Check-in opens ${eventDate(checkInWindow.opensAt)} and closes ${eventDate(checkInWindow.closesAt)}.`}
          </div>}
          <div className="checkin-actions">
            {!user ? <Link className="button button-dark" to="/login" state={{
            from: `${location.pathname}${location.search}`
          }}>Sign in to check in <ArrowRight size={17} /></Link> : attendance && !attendance.checkedInAt && <button className="button button-dark" disabled={busy || !checkInWindow?.isOpen} onClick={checkIn}>{busy ? 'Checking in...' : 'Confirm check-in'} <Check size={17} /></button>}
            <Link className="button button-outline" to={user ? '/my-activities' : `/events/${event.slug}`}>{user ? 'My Activities' : 'Event details'}</Link>
          </div>
        </div>
      </article>}
      {!loading && !event && <div className="notice error-notice" role="alert">{error || 'Event not found.'}</div>}
    </main>;
}
