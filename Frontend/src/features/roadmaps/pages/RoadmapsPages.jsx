import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, List, MapPin, Trophy, Users, X, Zap } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { LearningPath } from '../components/LearningPath.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { formatSessionTime, sessionDateKey, formatCalendarMonth, formatCalendarDay } from '../utils/roadmapUtils.js';
function RoadmapCard({
  roadmap,
  index = 0,
  openCycle,
  hasCycles,
  cycleAvailability,
}) {
  const difficulty = ['beginner', 'intermediate', 'advanced'].includes(roadmap.difficulty?.toLowerCase())
    ? roadmap.difficulty.toLowerCase()
    : null;
  return <article className={`roadmap-card roadmap-feature-card accent-${index % 4}`}>
    <div className="roadmap-card-media">
      {roadmap.coverImageUrl && <img className="roadmap-cover-image" src={roadmap.coverImageUrl} alt="" loading="lazy" onError={event => {
        event.currentTarget.hidden = true;
      }} />}
      <span className="roadmap-card-media-overlay" aria-hidden="true" />
    </div>
    <div className="roadmap-card-content">
      <div className="roadmap-card-heading">
        {difficulty && <span className={`roadmap-difficulty-badge is-${difficulty}`}>{difficulty}</span>}
        {roadmap.estimatedDuration && <span className="roadmap-duration-badge">{roadmap.estimatedDuration}</span>}
      </div>
      <h2><Link to={`/roadmaps/${roadmap.slug}`}>{roadmap.title}</Link></h2>
      <p className="roadmap-card-summary">{roadmap.description}</p>
      {openCycle ? <Link className="roadmap-live-cycle" to={`/roadmaps/${roadmap.slug}/cycles/${encodeURIComponent(openCycle._id)}`}>
        <span className="roadmap-live-dot" aria-hidden="true" />
        <span>Open Cycle: {openCycle.title}</span>
        <ArrowRight size={5} aria-hidden="true" />
      </Link> : cycleAvailability === 'available' ? <div className="roadmap-no-open-cycle"><BookOpen size={16} aria-hidden="true" /> {hasCycles ? 'No cycle currently open' : 'No scheduled cycles'}</div> : cycleAvailability === 'login' ? <Link className="roadmap-cycle-unavailable" to="/login">Sign in to view cycle availability</Link> : <div className="roadmap-cycle-unavailable">Cycle availability unavailable</div>}
      <Link className="button button-dark roadmap-card-link" to={`/roadmaps/${roadmap.slug}`}>Explore roadmap <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </article>;
}
export function RoadmapsPage({ token }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [cycles, setCycles] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cycleError, setCycleError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api('/roadmaps');
      setRoadmaps(result.roadmaps);
      if (token) {
        try {
          const cycleResult = await api('/roadmaps/cycles', { token });
          setCycles(cycleResult.cycles);
          setCycleError('');
        } catch (reason) {
          setCycles(null);
          setCycleError(reason.message);
        }
      } else {
        setCycles(null);
        setCycleError('');
      }
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);
  const visibleRoadmaps = activeFilter === 'all' ? roadmaps : roadmaps.filter(roadmap => roadmap.difficulty?.toLowerCase() === activeFilter);
  return <main className="page-wrap roadmaps-page roadmaps-index-page">
    <header className="roadmap-page-hero">
      <div className="roadmap-page-hero-copy">
        <span className="roadmap-page-hero-label">ROADMAP CATALOG</span>
        <h1>Learning <span>roadmaps</span></h1>
        <p>Master competitive programming topics step-by-step</p>
      </div>
      <Link className="roadmap-page-hero-action" to="/training"><Zap size={16} aria-hidden="true" /> Active Training Cycles <ArrowRight size={16} aria-hidden="true" /></Link>
    </header>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {cycleError && <div className="notice error-notice roadmap-cycle-fetch-error" role="alert">Live cycle availability could not be loaded: {cycleError} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {loading ? <LoadingState /> : roadmaps.length ? <>
      <div className="roadmap-level-filters" role="group" aria-label="Filter roadmaps by difficulty">
        {[['all', 'All Roadmaps'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([filter, label]) => <button key={filter} type="button" className={`roadmap-level-filter${activeFilter === filter ? ' is-active' : ''}`} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{label}</button>)}
      </div>
      {visibleRoadmaps.length ? <section className="roadmap-grid roadmap-feature-grid" aria-label={`${activeFilter === 'all' ? 'All' : activeFilter} learning roadmaps`}>
        {visibleRoadmaps.map((roadmap, index) => {
          const roadmapCycles = cycles?.filter(cycle => cycle.roadmap.slug === roadmap.slug) || [];
          const openCycle = roadmapCycles.find(cycle => cycle.registrationOpen);
          const cycleAvailability = cycles ? 'available' : token ? 'unavailable' : 'login';
          return <RoadmapCard key={roadmap._id} roadmap={roadmap} index={index} openCycle={openCycle} hasCycles={roadmapCycles.length > 0} cycleAvailability={cycleAvailability} />;
        })}
      </section> : <div className="roadmap-filter-empty" role="status"><h2>No {activeFilter} roadmaps yet.</h2><button className="text-link" type="button" onClick={() => setActiveFilter('all')}>View all roadmaps <ArrowRight size={15} aria-hidden="true" /></button></div>}
    </> : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h2>No roadmaps published yet.</h2><p>New learning paths will appear here when administrators publish them.</p></div>}
  </main>;
}
export function RoadmapDetailsPage({
  token,
  user
}) {
  const {
    slug
  } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roadmapRetry, setRoadmapRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/roadmaps/${encodeURIComponent(slug)}`).then(({ roadmap: result }) => {
      if (active) setRoadmap(result);
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [roadmapRetry, slug]);
  if (loading) return <main className="page-wrap"><LoadingState /></main>;
  if (error) return <main className="page-wrap"><div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={() => setRoadmapRetry(current => current + 1)}>Try again</button></div></main>;
  if (!roadmap) return <main className="page-wrap"><div className="empty-state"><h2>Roadmap unavailable</h2><p>This roadmap could not be found or is no longer available.</p><Link className="button button-outline" to="/roadmaps">Back to Roadmaps</Link></div></main>;
  const roadmapCategory = roadmap.level || roadmap.category || roadmap.difficulty;
  return <main className="page-wrap roadmaps-page roadmap-details-page">
    <header className="student-roadmap-header">
      <div className="student-roadmap-topbar">
        <Link className="student-roadmap-back" to="/roadmaps"><ChevronLeft size={17} aria-hidden="true" /> Back to Roadmaps</Link>
        {roadmapCategory && <span className="student-roadmap-category">{roadmapCategory}</span>}
        <h1>{roadmap.title}</h1>
      </div>
      {roadmap.description && <p>{roadmap.description}</p>}
    </header>
    <LearningPath nodes={roadmap.nodes || []} token={token} user={user} roadmapSlug={roadmap.slug} />
  </main>;
}
function parseCycleDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}
function formatCycleDateRange(startDate, endDate) {
  const start = parseCycleDate(startDate);
  const end = parseCycleDate(endDate);
  if (!start || !end) return `${startDate} – ${endDate}`;
  const startOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const endOptions = { ...startOptions, year: 'numeric' };
  if (start.getUTCFullYear() !== end.getUTCFullYear()) startOptions.year = 'numeric';
  return `${new Intl.DateTimeFormat('en-US', startOptions).format(start)} – ${new Intl.DateTimeFormat('en-US', endOptions).format(end)}`;
}
function formatCycleDate(value) {
  const date = parseCycleDate(value);
  return date ? new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date) : value;
}
function formatCycleLocation(location) {
  const value = location?.trim();
  if (!value) return '';
  if (/^(online|virtual|remote)$/i.test(value)) return 'Online';
  if (/on[- ]?site|in[- ]person/i.test(value)) return value;
  if (/^hall\b/i.test(value)) return /·\s*on[- ]?site/i.test(value) ? value : `${value} · On-Site`;
  return `Hall ${value} · On-Site`;
}
function formatCycleDetailLocation(location) {
  const value = location?.trim() || '';
  const room = /^(?:Hall\s+)?([A-Z])(\d+[A-Z]?)$/i.exec(value);
  if (room) return `Hall ${room[1].toUpperCase()}${room[2]} · Building ${room[1].toUpperCase()}`;
  return formatCycleLocation(value);
}
function getCycleCategory(cycle, today) {
  if (cycle.status === 'completed' || cycle.endDate < today) return 'completed';
  if (cycle.startDate > today) return 'upcoming';
  return 'active';
}
function getTodayDateKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
function CycleCard({
  cycle,
  roadmapSlug
}) {
  const capacity = Number.isFinite(cycle.capacity) && cycle.capacity > 0 ? cycle.capacity : null;
  const remainingCapacity = capacity === null ? null : Number.isFinite(cycle.remainingCapacity)
    ? Math.max(0, Math.min(capacity, cycle.remainingCapacity))
    : Math.max(0, capacity - (Number.isFinite(cycle.enrollmentCount) ? cycle.enrollmentCount : 0));
  const enrolledCount = capacity === null ? 0 : capacity - remainingCapacity;
  const capacityPercentage = capacity === null ? 0 : (enrolledCount / capacity) * 100;
  const location = formatCycleLocation(cycle.location);
  const roadmapPath = `/roadmaps/${encodeURIComponent(roadmapSlug)}`;
  const cyclePath = `${roadmapPath}/cycles/${encodeURIComponent(cycle._id)}`;
  return <article className="roadmap-cycle-card training-cycle-card">
    <div className="training-cycle-topline">
      <span className="training-cycle-difficulty">{cycle.difficulty || 'Training cycle'}</span>
      <span className="training-cycle-identifier">Cycle #{cycle.order || 1}</span>
    </div>
    <div className="training-cycle-title"><h2>{cycle.roadmap.title || cycle.title}</h2>{cycle.prerequisites && <p>Prerequisite: {cycle.prerequisites}</p>}</div>
    <p className="training-cycle-description">{cycle.description}</p>
    <div className="training-cycle-facts">
      <p className="roadmap-cycle-dates"><CalendarDays size={17} aria-hidden="true" /> <span>{formatCycleDateRange(cycle.startDate, cycle.endDate)}</span></p>
      <p className="roadmap-cycle-dates"><Clock3 size={17} aria-hidden="true" /> <span>{cycle.sessionsPerWeek} sessions / week <span aria-hidden="true">•</span> Registration closes {eventDate(cycle.registrationClosesAt, {
        weekday: undefined,
        year: undefined
      })}</span></p>
      {location && <p className="roadmap-cycle-dates"><MapPin size={17} aria-hidden="true" /> <span>{location}</span></p>}
    </div>
    <div className={`training-cycle-status${cycle.enrolled || cycle.registrationOpen ? ' is-open' : ' is-closed'}`} role="status">
      <span aria-hidden="true">●</span>{cycle.enrolled ? 'You are enrolled' : cycle.registrationOpen ? 'Registration Open' : 'Registration Closed'}
    </div>
    {capacity !== null ? <div className="training-cycle-capacity">
      <div className="training-cycle-capacity-label"><span><Users size={16} aria-hidden="true" /> Capacity</span><strong>{remainingCapacity} / {capacity} seats remaining</strong></div>
      <div className="training-cycle-capacity-track" role="progressbar" aria-label="Cycle enrollment capacity" aria-valuemin="0" aria-valuemax={capacity} aria-valuenow={enrolledCount} aria-valuetext={`${enrolledCount} of ${capacity} seats filled`}>
        <span style={{ width: `${capacityPercentage}%` }} />
      </div>
    </div> : <p className="training-cycle-capacity-unlimited">No seat limit</p>}
    <div className="roadmap-cycle-actions">
      <Link className="button button-dark training-cycle-primary-action" to={cyclePath}>View cycle <ArrowRight size={16} aria-hidden="true" /></Link>
      <Link className="training-roadmap-link" to={roadmapPath}><BookOpen size={16} aria-hidden="true" /> View Roadmap Details</Link>
    </div>
  </article>;
}
export function TrainingPage({
  token,
  user
}) {
  const location = useLocation();
  const [cycles, setCycles] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/roadmaps/cycles', {
        token
      });
      setCycles(result.cycles);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);
  if (!user || !token) return <Navigate to="/login" replace state={{
    from: `${location.pathname}${location.search}`
  }} />;
  const today = getTodayDateKey();
  const cycleGroups = {
    active: cycles.filter(cycle => getCycleCategory(cycle, today) === 'active'),
    upcoming: cycles.filter(cycle => getCycleCategory(cycle, today) === 'upcoming'),
    completed: cycles.filter(cycle => getCycleCategory(cycle, today) === 'completed')
  };
  const visibleCycles = cycleGroups[activeFilter];
  return <main className="page-wrap roadmaps-page training-page">
    <header className="roadmap-page-hero training-page-hero">
      <div className="roadmap-page-hero-copy">
        <span className="roadmap-page-hero-label">TRAINING CYCLES</span>
        <h1>Training <span>cycles</span></h1>
        <p><span className="training-description-full">Join a structured training cycle <span aria-hidden="true">•</span> Build your skills through guided sessions</span><span className="training-description-mobile">Explore guided sessions and build your skills.</span></p>
      </div>
      <Link className="roadmap-page-hero-action" to="/roadmaps"><BookOpen size={16} aria-hidden="true" /> Browse Roadmaps <ArrowRight size={16} aria-hidden="true" /></Link>
    </header>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {loading ? <LoadingState>Loading training cycles...</LoadingState> : cycles.length ? <>
      <div className="training-cycle-filters" role="group" aria-label="Filter training cycles">
        {['active', 'upcoming', 'completed'].map(filter => <button key={filter} type="button" className={activeFilter === filter ? 'training-cycle-filter is-active' : 'training-cycle-filter'} aria-label={`${filter.charAt(0).toUpperCase() + filter.slice(1)} cycles (${cycleGroups[filter].length})`} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
          <span className="training-cycle-filter-label-full">{filter.charAt(0).toUpperCase() + filter.slice(1)} Cycles</span><span className="training-cycle-filter-label-mobile">{filter.charAt(0).toUpperCase() + filter.slice(1)}</span><span className="training-cycle-filter-count">{cycleGroups[filter].length}</span>
        </button>)}
      </div>
      {visibleCycles.length ? <section className={`roadmap-cycle-grid training-cycle-grid${visibleCycles.length === 1 ? ' is-featured' : ''}`} aria-label={`${activeFilter} training cycles`}>
        {visibleCycles.map(cycle => <CycleCard key={cycle._id} cycle={cycle} roadmapSlug={cycle.roadmap.slug} />)}
      </section> : <div className="training-cycle-empty" role="status"><h2>No {activeFilter} cycles right now.</h2><p>Choose another filter to see more training opportunities</p></div>}
    </> : <div className="empty-state"><h2>No training cycles available yet.</h2><p>Published training cycles will appear here when they are available.</p></div>}
  </main>;
}
export function RoadmapCyclePage({
  token,
  user
}) {
  const {
    slug,
    cycleId
  } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('calendar');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const scheduleRef = useRef(null);
  const sessionDialogRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/roadmaps/${encodeURIComponent(slug)}/cycles/${encodeURIComponent(cycleId)}`, {
        token
      }));
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [cycleId, slug, token]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!selectedSession) return undefined;
    const previousFocus = document.activeElement;
    sessionDialogRef.current?.querySelector('.roadmap-session-dialog-close')?.focus();
    const handleDialogKeys = event => {
      if (event.key === 'Escape') {
        setSelectedSession(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = sessionDialogRef.current?.querySelectorAll('button:not(:disabled), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sessionDialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sessionDialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [selectedSession]);
  useEffect(() => {
    if (!data?.cycle?.startDate) return;
    const [year, month] = data.cycle.startDate.split('-').map(Number);
    setCalendarMonth(new Date(Date.UTC(year, month - 1, 1)));
  }, [data?.cycle?.startDate]);
  const enroll = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/roadmaps/${encodeURIComponent(slug)}/cycles/${encodeURIComponent(cycleId)}/enroll`, {
        method: 'POST',
        token
      });
      setSuccess('You are enrolled. Your cycle is now available in My Activities.');
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const leave = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api(`/roadmaps/${encodeURIComponent(slug)}/cycles/${encodeURIComponent(cycleId)}/enroll`, {
        method: 'DELETE',
        token
      });
      setConfirmLeave(false);
      setSuccess(result.message);
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  if (!user || !token) return <Navigate to="/login" replace state={{
    from: `${location.pathname}${location.search}`
  }} />;
  if (loading) return <main className="page-wrap"><LoadingState /></main>;
  if (error && !data) return <main className="page-wrap"><div className="notice error-notice" role="alert">{error}</div></main>;
  if (!data) return null;
  const {
    roadmap,
    cycle,
    enrolled,
    sessions
  } = data;
  const now = new Date();
  const nextSession = sessions
    .filter(session => session.status !== 'cancelled' && session.status !== 'completed' && new Date(session.endsAt) > now)
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0];
  const capacity = Number.isFinite(cycle.capacity) && cycle.capacity > 0 ? cycle.capacity : null;
  const enrollmentCount = Math.max(0, cycle.enrollmentCount || 0);
  const remainingSeats = capacity === null ? null : Math.max(0, capacity - enrollmentCount);
  const enrollmentPercentage = capacity === null ? 0 : Math.min(100, (enrollmentCount / capacity) * 100);
  const leaveAvailable = cycle.startDate > now.toISOString().slice(0, 10);
  const cycleDescription = cycle.description?.trim();
  const roadmapDescription = roadmap.title.trim().toLowerCase();
  const showCycleDescription = cycleDescription && cycleDescription.toLowerCase() !== roadmapDescription && cycleDescription.toLowerCase() !== `roadmap ${roadmapDescription}`;
  const calendarYear = calendarMonth.getUTCFullYear();
  const calendarMonthIndex = calendarMonth.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + 1, 0)).getUTCDate();
  const leadingDays = new Date(Date.UTC(calendarYear, calendarMonthIndex, 1)).getUTCDay();
  const calendarCells = Array.from({
    length: 42
  }, (_, index) => {
    const day = index - leadingDays + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(Date.UTC(calendarYear, calendarMonthIndex, day));
    const key = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      date,
      key,
      day
    };
  });
  const sessionsByDate = sessions.reduce((grouped, session) => {
    const key = sessionDateKey(session, cycle.timeZone);
    grouped[key] = [...(grouped[key] || []), session];
    return grouped;
  }, {});
  const weekdayLabels = Array.from({
    length: 7
  }, (_, index) => formatCalendarDay(new Date(Date.UTC(2024, 0, index + 7))));
  const calendarWeekCount = Math.ceil((leadingDays + daysInMonth) / 7);
  const calendarWeeks = Array.from({
    length: calendarWeekCount
  }, (_, week) => calendarCells.slice(week * 7, (week + 1) * 7));
  const todayKey = sessionDateKey({
    startsAt: now,
    timeZone: cycle.timeZone
  }, cycle.timeZone);
  const calendarUrl = nextSession ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${roadmap.title} · ${nextSession.title}`)}&dates=${encodeURIComponent(`${new Date(nextSession.startsAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(nextSession.endsAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`)}&details=${encodeURIComponent(nextSession.description || `Session ${nextSession.ordinal} in ${cycle.title}`)}&location=${encodeURIComponent(cycle.location || '')}` : null;
  const openMaterials = () => {
    setViewMode('list');
    scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const getSessionState = session => {
    if (session.status === 'cancelled') return 'is-cancelled';
    if (session.status === 'completed' || new Date(session.endsAt) < now) return 'is-completed';
    if (nextSession?._id === session._id) return 'is-next-session';
    return 'is-upcoming';
  };
  return <main className="page-wrap roadmaps-page">
    <Link className="roadmap-cycle-back-link" to={`/roadmaps/${roadmap.slug}/cycles`}><ChevronLeft size={19} aria-hidden="true" /> {roadmap.title} cycles</Link>
    <div className="roadmap-detail-header roadmap-cycle-detail-header"><span className="roadmap-cycle-detail-kicker">{roadmap.title} <span aria-hidden="true">·</span> Cycle #{cycle.order}</span><h1>{cycle.title}</h1>{showCycleDescription && <p>{cycleDescription}</p>}
      <section className="roadmap-cycle-data-card" aria-label="Cycle details">
        <div><CalendarDays size={18} /><span><small>Cycle dates</small><strong>{formatCycleDateRange(cycle.startDate, cycle.endDate)}</strong></span></div>
        <div><Clock3 size={18} /><span><small>Weekly schedule</small><strong>{cycle.sessionsPerWeek} days / week · {cycle.sessionDurationMinutes} minutes</strong></span></div>
        {cycle.location && <div><MapPin size={18} /><span><small>Location</small><strong>{formatCycleDetailLocation(cycle.location)}</strong></span></div>}
        <div className="roadmap-cycle-enrollment-stat"><BookOpen size={18} /><span><small>Enrollment</small><strong>{enrollmentCount}{capacity ? ` / ${capacity}` : ''} enrolled</strong>
          {capacity !== null && <><div className="cycle-enrollment-progress" role="progressbar" aria-label="Cycle enrollment" aria-valuemin="0" aria-valuemax={capacity} aria-valuenow={enrollmentCount} aria-valuetext={`${enrollmentCount} of ${capacity} enrolled`}><span style={{ width: `${enrollmentPercentage}%` }} /></div><small>{remainingSeats} seats remaining</small></>}
        </span></div>
      </section>
    </div>
    {cycle.objectives?.length > 0 && <section className="roadmap-content-section"><h2>Cycle objectives</h2><ul className="roadmap-objectives">{cycle.objectives.map(item => <li key={item}>{item}</li>)}</ul></section>}
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {success && <div className="notice success-notice" role="status">{success}</div>}
    {cycle.status === 'published' && (enrolled ? <section className="roadmap-enroll-panel roadmap-cycle-enroll-panel is-enrolled" aria-labelledby="cycle-enrollment-title">
      <div className="roadmap-enrollment-message"><span className="roadmap-enrollment-check"><Check size={19} aria-hidden="true" /></span><div><h2 id="cycle-enrollment-title">You are enrolled in this cycle!</h2><p>Your sessions and materials are ready below.</p>{leaveAvailable && <small>You can leave this cycle until {formatCycleDate(cycle.startDate)}.</small>}</div></div>
      <div className="roadmap-enrollment-actions">
        {calendarUrl && <a className="button button-outline" href={calendarUrl} target="_blank" rel="noopener noreferrer"><CalendarPlus size={17} /> Add to Google Calendar</a>}
        <button className="button button-outline" type="button" onClick={openMaterials}><BookOpen size={17} /> Access Materials</button>
        {leaveAvailable && <button className="roadmap-leave-button" type="button" onClick={() => setConfirmLeave(value => !value)} disabled={busy}>Leave Cycle</button>}
      </div>
      {confirmLeave && leaveAvailable && <div className="roadmap-leave-confirm" role="alert"><p>Leave this cycle? Your attendance history will be kept, but you will lose access to enrolled materials.</p><div><button className="button button-outline" type="button" onClick={() => setConfirmLeave(false)} disabled={busy}>Keep enrollment</button><button className="button button-danger" type="button" onClick={leave} disabled={busy}>{busy ? 'Leaving...' : 'Confirm leave'}</button></div></div>}
    </section> : <section className="roadmap-enroll-panel roadmap-cycle-enroll-panel" aria-labelledby="cycle-enrollment-title">
      <div><h2 id="cycle-enrollment-title">Join this cycle</h2><p>One enrollment gives you access to the full session schedule and learning materials.</p><small>Registration closes {eventDate(cycle.registrationClosesAt)}</small>{remainingSeats !== null && <strong className="roadmap-seats-remaining">🔥 Only {remainingSeats} {remainingSeats === 1 ? 'seat' : 'seats'} left!</strong>}</div>
      <div className="roadmap-enrollment-actions">
        {user?.role === 'user' && data.registrationOpen && <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling...' : 'Enroll in cycle'} <ArrowRight size={16} /></button>}
        {!data.registrationOpen && <span className="check-status">Registration is currently closed.</span>}
      </div>
    </section>)}
    <section className="roadmap-content-section roadmap-cycle-schedule" ref={scheduleRef}>
      <div className="roadmap-cycle-schedule-heading"><div><h2>Session schedule</h2><p>Browse every session in this cycle.</p></div>
        {sessions.length > 0 && <div className="roadmap-cycle-view-switcher" role="group" aria-label="Session schedule view">
          <button type="button" className={viewMode === 'calendar' ? 'is-active' : ''} aria-pressed={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}><CalendarDays size={16} /> Calendar View</button>
          <button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><List size={16} /> Timeline / List View</button>
        </div>}
      </div>
      {sessions.length ? <div className="roadmap-calendar" aria-label={`${cycle.title} session calendar`}>
        {viewMode === 'calendar' ? <>
        <div className="roadmap-calendar-toolbar">
          <button className="roadmap-calendar-nav" type="button" aria-label="Previous month" onClick={() => setCalendarMonth(month => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft size={20} /></button>
          <h3 aria-live="polite">{formatCalendarMonth(calendarMonth, cycle.timeZone)}</h3>
          <button className="roadmap-calendar-nav" type="button" aria-label="Next month" onClick={() => setCalendarMonth(month => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><ChevronRight size={20} /></button>
        </div>
        <div className="roadmap-calendar-grid" role="grid" aria-label={formatCalendarMonth(calendarMonth, cycle.timeZone)}>
          <div className="roadmap-calendar-week roadmap-calendar-head" role="row">
            {weekdayLabels.map((weekday, index) => <div className="roadmap-calendar-weekday" role="columnheader" key={`${index}-${weekday}`}>{weekday}</div>)}
          </div>
          {calendarWeeks.map((week, weekIndex) => <div className="roadmap-calendar-week" role="row" key={`week-${weekIndex}`}>
            {week.map((cell, dayIndex) => cell ? <div className={`roadmap-calendar-day${cell.key === todayKey ? ' is-today' : ''}`} role="gridcell" key={cell.key} aria-label={`${formatCalendarDay(cell.date, {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}${sessionsByDate[cell.key]?.length ? `, ${sessionsByDate[cell.key].length} sessions` : ''}`}>
              <span className="roadmap-calendar-day-number" aria-hidden="true">{cell.day}</span>
              <div className="roadmap-calendar-events">
                {(sessionsByDate[cell.key] || []).map(session => <button className={`roadmap-calendar-event ${getSessionState(session)}`} type="button" key={session._id} onClick={() => setSelectedSession(session)} aria-label={`${session.title}, ${formatSessionTime(session)}${session.status === 'cancelled' ? ', cancelled' : ''}`}>
                  <span>{session.title}</span>
                  <small>{new Intl.DateTimeFormat(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: session.timeZone || cycle.timeZone
                    }).format(new Date(session.startsAt))}</small>
                </button>)}
              </div>
            </div> : <div className="roadmap-calendar-day is-outside" role="gridcell" aria-hidden="true" key={`outside-${weekIndex}-${dayIndex}`} />)}
          </div>)}
        </div>
        <p className="roadmap-calendar-hint">Select a session to view its details.</p>
        </> : <div className="roadmap-session-list roadmap-cycle-timeline">
          {sessions.map(session => <SessionRow key={session._id} session={session} enrolled={enrolled} sessionState={getSessionState(session)} />)}
        </div>}
      </div> : <div className="empty-state"><h3>The schedule is being prepared.</h3><p>Sessions will appear here after an administrator confirms the schedule.</p></div>}
    </section>
    {selectedSession && <div className="roadmap-session-dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) setSelectedSession(null);
    }}>
      <section className="roadmap-session-dialog" ref={sessionDialogRef} role="dialog" aria-modal="true" aria-labelledby="roadmap-session-dialog-title">
        <button className="roadmap-session-dialog-close" type="button" aria-label="Close session details" onClick={() => setSelectedSession(null)}><X size={20} /></button>
        <span className={`roadmap-session-dialog-tag${selectedSession.status === 'cancelled' ? ' is-cancelled' : ''}`}>{selectedSession.status === 'cancelled' ? 'Cancelled session' : cycle.difficulty}</span>
        <h2 id="roadmap-session-dialog-title">{selectedSession.title}</h2>
        <div className="roadmap-session-dialog-details">
          <p><strong>Date &amp; time:</strong> {formatSessionTime(selectedSession)}</p>
          <p><strong>Duration:</strong> {selectedSession.sessionDurationMinutes} minutes</p>
          {selectedSession.instructor && <p><strong>Instructor:</strong> {selectedSession.instructor}</p>}
          <p><strong>Status:</strong> {selectedSession.status}</p>
          {selectedSession.description && <p className="roadmap-session-dialog-description">{selectedSession.description}</p>}
        </div>
        {selectedSession.attended && <span className="registered-badge"><Check size={15} /> Attended · +{selectedSession.attendancePoints - (selectedSession.pointsReversed || 0)} pts</span>}
        {enrolled && [...(selectedSession.materials || []), ...(selectedSession.problemSets || [])].length > 0 && <div className="roadmap-session-dialog-resources">
          {[...(selectedSession.materials || []), ...(selectedSession.problemSets || [])].map(resource => <a className="roadmap-resource-link" key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {resource.title}</a>)}
        </div>}
        {!enrolled && cycle.status === 'published' && selectedSession.status !== 'cancelled' && (user ? <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling...' : 'Enroll in cycle'} <ArrowRight size={16} /></button> : <Link className="button button-dark" to="/login">Sign in to enroll <ArrowRight size={16} /></Link>)}
      </section>
    </div>}
  </main>;
}
function SessionRow({
  session,
  enrolled,
  sessionState = ''
}) {
  return <article className={`roadmap-session-row ${sessionState}`}>
    <div className="roadmap-session-time"><CalendarDays size={17} /><span>{formatSessionTime(session)}</span><small>{session.sessionDurationMinutes} minutes · {session.status}</small></div>
    <div className="roadmap-session-copy"><h3>{session.title}</h3>{session.description && <p>{session.description}</p>}
      {session.attended && <span className="registered-badge"><Check size={15} /> Attended · +{session.attendancePoints - (session.pointsReversed || 0)} pts</span>}
      {enrolled && [...(session.materials || []), ...(session.problemSets || [])].map(resource => <a className="roadmap-resource-link" key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {resource.title}</a>)}
    </div>
  </article>;
}
export function MyRoadmapsSection({
  token
}) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/roadmaps/my', {
      token
    }).then(({
      roadmaps: result
    }) => {
      if (active) setRoadmaps(result);
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey, token]);
  const groupedRoadmaps = roadmaps.reduce((groups, item) => {
    const {
      roadmap,
      cycle,
      enrollment,
      progress
    } = item;
    const key = roadmap?._id || `archived-${cycle._id}`;
    let group = groups.find(candidate => candidate.key === key);
    if (!group) {
      group = {
        key,
        roadmap,
        cycles: []
      };
      groups.push(group);
    }
    group.cycles.push({
      cycle,
      enrollment,
      progress
    });
    return groups;
  }, []);
  return <section className="my-activities-section my-roadmaps-section" aria-labelledby="my-roadmaps-heading">
    <div className="my-activities-section-heading"><div><h2 id="my-roadmaps-heading">My Roadmaps</h2></div><Link className="text-link" to="/roadmaps">Explore roadmaps <ArrowRight size={15} /></Link></div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={() => setReloadKey(value => value + 1)}>Try again</button></div>}
    {loading ? <LoadingState>Loading your roadmaps...</LoadingState> : error ? null : groupedRoadmaps.length ? <section className="my-roadmap-list" aria-label="Joined roadmaps">{groupedRoadmaps.map(({
        key,
        roadmap,
        cycles
      }) => <article className="my-roadmap-card my-activities-roadmap-card" key={key}>
      <div className="roadmap-card-heading"><span className="category-label">JOINED ROADMAP</span><span>{cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'} joined</span></div>
      <h3>{roadmap?.slug ? <Link to={`/roadmaps/${roadmap.slug}`}>{roadmap.title}</Link> : roadmap?.title || 'Archived roadmap'}</h3>
      {roadmap?.description && <p className="my-roadmap-description">{roadmap.description}</p>}
      <div className="my-roadmap-cycles">{cycles.map(({
            cycle,
            enrollment,
            progress
          }) => <article className="my-roadmap-cycle-card" key={cycle._id}>
        <div className="roadmap-card-heading"><span className="category-label">{cycle.status} · {cycle.difficulty}</span><span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span></div>
        <h4>{cycle.title}</h4><p>{cycle.startDate} – {cycle.endDate}</p>
        <div className="roadmap-progress-stats"><div><strong>{progress.completedSessions}/{progress.totalSessions}</strong><small>Sessions completed</small></div><div><strong>{progress.progressPercentage}%</strong><small>Session progress</small></div><div><strong>{progress.attendancePercentage}%</strong><small>Attendance · {progress.sessionsAttended} present</small></div></div>
        <div className="roadmap-progress-track" role="progressbar" aria-label={`${cycle.title} session progress`} aria-valuenow={progress.progressPercentage} aria-valuemin="0" aria-valuemax="100"><span style={{
                width: `${progress.progressPercentage}%`
              }} /></div>
        <div className="roadmap-upcoming-sessions"><h5>Next session</h5>{cycle.sessions.find(session => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()) ? <p><CalendarDays size={14} /> {formatSessionTime(cycle.sessions.find(session => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()))} · {cycle.sessions.find(session => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()).title}</p> : <p>No upcoming sessions scheduled.</p>}</div>
        <p><Trophy size={15} /> {progress.points} roadmap points</p>
        <Link className="button button-outline" to={`/roadmaps/${encodeURIComponent(roadmap.slug)}/cycles/${cycle._id}`}>View cycle details <ArrowRight size={15} /></Link>
      </article>)}</div>
    </article>)}</section> : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h3>No joined roadmaps yet.</h3><p>Join a cycle to see its roadmap and learning progress here.</p><Link className="button button-dark" to="/roadmaps">Browse roadmaps <ArrowRight size={16} /></Link></div>}
  </section>;
}
export function RoadmapCheckInPage({
  token
}) {
  const {
    sessionId
  } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const qrToken = new URLSearchParams(location.search).get('token') || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api(`/roadmaps/sessions/${encodeURIComponent(sessionId)}/check-in?token=${encodeURIComponent(qrToken)}`, {
      token
    }).then(setData).catch(reason => setError(reason.message)).finally(() => setLoading(false));
  }, [qrToken, sessionId, token]);
  const checkIn = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api(`/roadmaps/sessions/${encodeURIComponent(sessionId)}/check-in`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          token: qrToken
        })
      });
      setData(current => ({
        ...current,
        attendance: result.attendance
      }));
      setSuccess(`Check-in successful. You earned ${result.attendance.pointsAwarded} roadmap points.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <main className="page-wrap"><LoadingState>Checking your session link...</LoadingState></main>;
  return <main className="page-wrap roadmap-checkin-page">
    <Link className="text-link" to="/my-activities">← My Activities</Link>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {data && <section className="roadmap-checkin-card"><span className="eyebrow">SESSION ATTENDANCE</span><h1>{data.session.title}</h1><p>{formatSessionTime(data.session)}</p>
      {success && <div className="notice success-notice" role="status">{success}</div>}
      {data.attendance ? <div className="notice success-notice"><Check size={17} /> Already checked in · {data.attendance.pointsAwarded} points</div> : <button className="button button-dark" type="button" disabled={busy || !data.checkInWindow.isOpen} onClick={checkIn}>{busy ? 'Checking in...' : data.checkInWindow.isOpen ? 'Confirm attendance' : 'Check-in is not open'} <Check size={16} /></button>}
      <button className="button button-outline" type="button" onClick={() => navigate('/my-activities')}>Return to My Activities</button>
    </section>}
  </main>;
}
