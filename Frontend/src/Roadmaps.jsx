import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, ExternalLink, Plus, QrCode, Save, Trophy } from 'lucide-react';
import { api, eventDate } from './api.js';

const weekdays = [
  ['Sunday', 0], ['Monday', 1], ['Tuesday', 2], ['Wednesday', 3],
  ['Thursday', 4], ['Friday', 5], ['Saturday', 6],
];

function formatSessionTime(session) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: session.timeZone || 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(session.startsAt));
}

function timeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
}

function formatDateTimeInput(value, timeZone) {
  const parts = timeZoneParts(new Date(value), timeZone || 'UTC');
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

function dateTimeInputToIso(value, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Enter a valid session date and time.');
  const [, year, month, day, hour, minute] = match.map(Number);
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set();
  for (const offsetHours of [-36, -12, 0, 12, 36]) {
    const instant = wallTime + offsetHours * 60 * 60 * 1000;
    const parts = timeZoneParts(new Date(instant), timeZone || 'UTC');
    offsets.add(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant);
  }
  const candidates = [...offsets]
    .map((offset) => new Date(wallTime - offset))
    .filter((date) => {
      const parts = timeZoneParts(date, timeZone || 'UTC');
      return parts.year === year && parts.month === month && parts.day === day
        && parts.hour === hour && parts.minute === minute && parts.second === 0;
    })
    .sort((left, right) => left - right);
  if (!candidates.length) throw new Error(`The selected local time does not exist in ${timeZone}.`);
  return candidates[0].toISOString();
}

function LoadingState({ children = 'Loading roadmaps...' }) {
  return <div className="empty-state"><span className="loader" /> {children}</div>;
}

function RoadmapCard({ roadmap, index = 0 }) {
  return <article className={`roadmap-card accent-${index % 4}`}>
    {roadmap.coverImageUrl && <img className="roadmap-cover-image" src={roadmap.coverImageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
    <div className="roadmap-card-heading"><span className="category-label">{roadmap.status}</span><span>{roadmap.cycles?.length || 0} cycles</span></div>
    <h2><Link to={`/roadmaps/${roadmap.slug}`}>{roadmap.title}</Link></h2>
    <p>{roadmap.description}</p>
    {roadmap.objectives?.length > 0 && <ul>{roadmap.objectives.slice(0, 3).map((objective) => <li key={objective}>{objective}</li>)}</ul>}
    <Link className="text-link roadmap-card-link" to={`/roadmaps/${roadmap.slug}`}>Explore roadmap <ArrowRight size={15} /></Link>
  </article>;
}

export function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/roadmaps');
      setRoadmaps(result.roadmaps);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return <main className="page-wrap roadmaps-page">
    <div className="page-heading"><span className="eyebrow">STRUCTURED PRACTICE</span><h1>Learning <span>roadmaps.</span></h1><p>Follow a structured path, enroll once in a cycle, and track your real attendance and progress.</p></div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {loading ? <LoadingState /> : roadmaps.length
      ? <section className="roadmap-grid" aria-label="Published learning roadmaps">{roadmaps.map((roadmap, index) => <RoadmapCard key={roadmap._id} roadmap={roadmap} index={index} />)}</section>
      : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h2>No roadmaps published yet.</h2><p>New learning paths will appear here when administrators publish them.</p></div>}
  </main>;
}

export function RoadmapDetailsPage() {
  const { slug } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/roadmaps/${encodeURIComponent(slug)}`)
      .then(({ roadmap: result }) => { if (active) setRoadmap(result); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="page-wrap"><LoadingState /></main>;
  if (error) return <main className="page-wrap"><div className="notice error-notice" role="alert">{error}</div></main>;
  if (!roadmap) return null;
  return <main className="page-wrap roadmaps-page">
    <Link className="text-link" to="/roadmaps">← All roadmaps</Link>
    <div className="roadmap-detail-header"><span className="eyebrow">LEARNING ROADMAP</span><h1>{roadmap.title}<span>.</span></h1><p>{roadmap.description}</p>
      {roadmap.audience && <p><strong>For:</strong> {roadmap.audience}</p>}
      {roadmap.prerequisites && <p><strong>Prerequisites:</strong> {roadmap.prerequisites}</p>}
    </div>
    {roadmap.objectives?.length > 0 && <section className="roadmap-content-section"><h2>Learning objectives</h2><ul className="roadmap-objectives">{roadmap.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section>}
    <section className="roadmap-content-section">
      <div className="section-heading"><div><span className="eyebrow">PROGRESSION</span><h2>Cycles <span>in this roadmap.</span></h2></div></div>
      {roadmap.cycles?.length ? <div className="roadmap-cycle-grid">{roadmap.cycles.map((cycle) => <CycleCard key={cycle._id} cycle={cycle} />)}</div>
        : <div className="empty-state"><h3>Cycles are being prepared.</h3><p>Check back when the roadmap team publishes its schedule.</p></div>}
    </section>
  </main>;
}

function CycleCard({ cycle }) {
  return <article className="roadmap-cycle-card">
    <div className="roadmap-card-heading"><span className="category-label">{cycle.difficulty}</span><span>{cycle.sessionCount ?? cycle.sessionsPerWeek} {cycle.sessionCount === undefined ? 'sessions / week' : 'sessions'}</span></div>
    <h3>{cycle.title}</h3><p>{cycle.description}</p>
    <p className="roadmap-cycle-dates"><CalendarDays size={15} /> {cycle.startDate} – {cycle.endDate}</p>
    <Link className="button button-outline" to={`/roadmaps/cycles/${cycle._id}`}>View cycle <ArrowRight size={15} /></Link>
  </article>;
}

export function RoadmapCyclePage({ token, user }) {
  const { cycleId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/roadmaps/cycles/${encodeURIComponent(cycleId)}`, { token }));
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [cycleId, token]);
  useEffect(() => { load(); }, [load]);

  const enroll = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/roadmaps/cycles/${encodeURIComponent(cycleId)}/enroll`, { method: 'POST', token });
      setSuccess('You are enrolled. The cycle sessions are now available in My Roadmaps.');
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="page-wrap"><LoadingState /></main>;
  if (error && !data) return <main className="page-wrap"><div className="notice error-notice" role="alert">{error}</div></main>;
  if (!data) return null;
  const { roadmap, cycle, enrolled, sessions } = data;
  return <main className="page-wrap roadmaps-page">
    <Link className="text-link" to={`/roadmaps/${roadmap.slug}`}>← {roadmap.title}</Link>
    <div className="roadmap-detail-header"><span className="eyebrow">{cycle.difficulty} CYCLE</span><h1>{cycle.title}<span>.</span></h1><p>{cycle.description}</p>
      <div className="roadmap-facts"><span><CalendarDays size={16} /> {cycle.startDate} – {cycle.endDate}</span><span><Clock3 size={16} /> {cycle.sessionsPerWeek} days / week · {cycle.sessionDurationMinutes} minutes</span><span>{cycle.enrollmentCount}{cycle.capacity ? ` / ${cycle.capacity}` : ''} enrolled</span></div>
    </div>
    {cycle.objectives?.length > 0 && <section className="roadmap-content-section"><h2>Cycle objectives</h2><ul className="roadmap-objectives">{cycle.objectives.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {success && <div className="notice success-notice" role="status">{success}</div>}
    {!enrolled && cycle.status === 'published' && <section className="roadmap-enroll-panel">
      <div><h2>Join this cycle</h2><p>Enrollment covers every scheduled session in the cycle. There is no session-by-session registration.</p><small>Registration: {eventDate(cycle.registrationOpensAt)} – {eventDate(cycle.registrationClosesAt)}</small></div>
      {user ? <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling...' : 'Enroll in cycle'} <ArrowRight size={16} /></button>
        : <Link className="button button-dark" to="/login">Sign in to enroll <ArrowRight size={16} /></Link>}
    </section>}
    {enrolled && <div className="notice success-notice"><Check size={17} /> You’re enrolled in this cycle.</div>}
    <section className="roadmap-content-section">
      <h2>Session schedule</h2>
      {sessions.length ? <div className="roadmap-session-list">{sessions.map((session) => <SessionRow key={session._id} session={session} enrolled={enrolled} />)}</div>
        : <div className="empty-state"><h3>The schedule is being prepared.</h3><p>Sessions will appear here after an administrator confirms the schedule.</p></div>}
    </section>
  </main>;
}

function SessionRow({ session, enrolled }) {
  return <article className={`roadmap-session-row ${session.status === 'cancelled' ? 'cancelled' : ''}`}>
    <div className="roadmap-session-time"><CalendarDays size={17} /><span>{formatSessionTime(session)}</span><small>{session.sessionDurationMinutes} minutes · {session.status}</small></div>
    <div className="roadmap-session-copy"><h3>{session.title}</h3>{session.description && <p>{session.description}</p>}
      {session.attended && <span className="registered-badge"><Check size={15} /> Attended · +{session.attendancePoints - (session.pointsReversed || 0)} pts</span>}
      {enrolled && [...(session.materials || []), ...(session.problemSets || [])].map((resource) => <a className="roadmap-resource-link" key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {resource.title}</a>)}
    </div>
  </article>;
}

export function MyRoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/roadmaps/my')
      .then(({ roadmaps: result }) => setRoadmaps(result))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);
  return <main className="page-wrap roadmaps-page">
    <div className="page-heading"><span className="eyebrow">YOUR LEARNING</span><h1>My <span>roadmaps.</span></h1><p>Your enrolled cycles, real session schedule, attendance, and earned roadmap points.</p></div>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {loading ? <LoadingState /> : roadmaps.length ? <section className="my-roadmap-list">{roadmaps.map(({ roadmap, cycle, enrollment, progress }) => <article className="my-roadmap-card" key={cycle._id}>
      <div className="roadmap-card-heading"><span className="category-label">{cycle.status}</span><span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span></div>
      <h2>{roadmap?.title || 'Archived roadmap'}</h2><h3>{cycle.title}</h3>
      <div className="roadmap-progress-stats"><div><strong>{progress.sessionsAttended}/{progress.totalSessions}</strong><small>Sessions attended</small></div><div><strong>{progress.attendancePercentage}%</strong><small>Attendance</small></div><div><strong><Trophy size={15} /> {progress.points}</strong><small>Roadmap points</small></div></div>
      <div className="roadmap-progress-track" role="progressbar" aria-valuenow={progress.attendancePercentage} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progress.attendancePercentage}%` }} /></div>
    <div className="roadmap-upcoming-sessions"><h4>Upcoming sessions</h4>{cycle.sessions.filter((session) => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()).slice(0, 3).map((session) => <p key={session._id}><CalendarDays size={14} /> {formatSessionTime(session)} · {session.title}</p>)}{!cycle.sessions.some((session) => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()) && <p>No upcoming sessions scheduled.</p>}<Link className="text-link" to={`/roadmaps/cycles/${cycle._id}`}>View full cycle schedule <ArrowRight size={14} /></Link></div>
    <div className="roadmap-upcoming-sessions roadmap-past-sessions"><h4>Past sessions and attendance</h4>{cycle.sessions.filter((session) => session.status !== 'cancelled' && new Date(session.startsAt) < new Date()).slice(-8).reverse().map((session) => <p key={session._id}><CalendarDays size={14} /> {formatSessionTime(session)} · {session.title} · {session.attended ? `Attended · +${session.pointsAwarded} pts` : 'Not attended'}</p>)}{!cycle.sessions.some((session) => session.status !== 'cancelled' && new Date(session.startsAt) < new Date()) && <p>No past sessions yet.</p>}</div>
    </article>)}</section> : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h3>You haven’t joined a cycle yet.</h3><p>Explore published roadmaps and enroll in a cycle when registration is open.</p><Link className="button button-dark" to="/roadmaps">Browse roadmaps <ArrowRight size={16} /></Link></div>}
  </main>;
}

export function RoadmapCheckInPage({ token }) {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const qrToken = new URLSearchParams(location.search).get('token') || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api(`/roadmaps/sessions/${encodeURIComponent(sessionId)}/check-in?token=${encodeURIComponent(qrToken)}`, { token })
      .then(setData)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [qrToken, sessionId, token]);
  const checkIn = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api(`/roadmaps/sessions/${encodeURIComponent(sessionId)}/check-in`, { method: 'POST', token, body: JSON.stringify({ token: qrToken }) });
      setData((current) => ({ ...current, attendance: result.attendance }));
      setSuccess(`Check-in successful. You earned ${result.attendance.pointsAwarded} roadmap points.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <main className="page-wrap"><LoadingState>Checking your session link...</LoadingState></main>;
  return <main className="page-wrap roadmap-checkin-page">
    <Link className="text-link" to="/my-roadmaps">← My roadmaps</Link>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {data && <section className="roadmap-checkin-card"><span className="eyebrow">SESSION ATTENDANCE</span><h1>{data.session.title}</h1><p>{formatSessionTime(data.session)}</p>
      {success && <div className="notice success-notice" role="status">{success}</div>}
      {data.attendance ? <div className="notice success-notice"><Check size={17} /> Already checked in · {data.attendance.pointsAwarded} points</div>
        : <button className="button button-dark" type="button" disabled={busy || !data.checkInWindow.isOpen} onClick={checkIn}>{busy ? 'Checking in...' : data.checkInWindow.isOpen ? 'Confirm attendance' : 'Check-in is not open'} <Check size={16} /></button>}
      <button className="button button-outline" type="button" onClick={() => navigate('/my-roadmaps')}>Return to My Roadmaps</button>
    </section>}
  </main>;
}

function emptyCycleForm(timeZone) {
  return {
    order: 1, title: '', description: '', difficulty: 'beginner', objectives: '',
    prerequisites: '', startDate: '', endDate: '', sessionsPerWeek: 1,
    trainingDays: [], startTime: '18:00', sessionDurationMinutes: 120, timeZone,
    registrationOpensAt: '', registrationClosesAt: '', capacity: '', attendancePoints: 0, status: 'draft',
  };
}

function toCyclePayload(form) {
  return {
    order: Number(form.order),
    title: form.title,
    description: form.description,
    difficulty: form.difficulty,
    objectives: form.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
    prerequisites: form.prerequisites,
    startDate: form.startDate,
    endDate: form.endDate,
    sessionsPerWeek: Number(form.sessionsPerWeek),
    trainingDays: form.trainingDays,
    startTime: form.startTime,
    sessionDurationMinutes: Number(form.sessionDurationMinutes),
    timeZone: form.timeZone,
    registrationOpensAt: new Date(form.registrationOpensAt).toISOString(),
    registrationClosesAt: new Date(form.registrationClosesAt).toISOString(),
    capacity: form.capacity === '' ? null : Number(form.capacity),
    attendancePoints: Number(form.attendancePoints),
    status: form.status,
  };
}

function formatResources(resources = []) {
  return resources.map(({ title, url }) => `${title} | ${url}`).join('\n');
}

function parseResources(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf('|');
    if (separator < 1) throw new Error('Use one resource per line in the format: title | https://example.com');
    return { title: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
  });
}

function AdminSession({ token, session, students, refresh }) {
  const [form, setForm] = useState({
    title: session.title,
    description: session.description || '',
    instructor: session.instructor || '',
    status: session.status,
    attendancePoints: session.attendancePoints,
    materials: formatResources(session.materials),
    problemSets: formatResources(session.problemSets),
    startsAt: formatDateTimeInput(session.startsAt, session.timeZone),
    endsAt: formatDateTimeInput(session.endsAt, session.timeZone),
  });
  const [attendance, setAttendance] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const loadAttendance = async () => {
    try {
      const result = await api(`/admin/roadmap-sessions/${session._id}/attendance`, { token });
      setAttendance(result.attendance);
    } catch (reason) { setError(reason.message); }
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = {
        title: form.title,
        description: form.description,
        instructor: form.instructor,
        status: form.status,
        attendancePoints: Number(form.attendancePoints),
        startsAt: dateTimeInputToIso(form.startsAt, session.timeZone),
        endsAt: dateTimeInputToIso(form.endsAt, session.timeZone),
        materials: parseResources(form.materials),
        problemSets: parseResources(form.problemSets),
      };
      await api(`/admin/roadmap-sessions/${session._id}`, { method: 'PUT', token, body: JSON.stringify(body) });
      setMessage('Session saved.');
      await refresh();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const createQr = async () => {
    setBusy(true);
    setError('');
    try {
      setQr(await api(`/admin/roadmap-sessions/${session._id}/check-in-qr`, { method: 'POST', token }));
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const addManualAttendance = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/admin/roadmap-sessions/${session._id}/attendance`, { method: 'POST', token, body: JSON.stringify({ studentId }) });
      setStudentId('');
      setMessage('Manual attendance recorded with this session’s configured points.');
      await loadAttendance();
      await refresh();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const reversePoints = async (item) => {
    const reason = window.prompt('Reason for reversing this points award:');
    if (!reason?.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api(`/admin/roadmap-sessions/${session._id}/attendance/${item._id}/reverse-points`, { method: 'PATCH', token, body: JSON.stringify({ reason }) });
      setMessage('Points reversed. The attendance record remains in the audit history.');
      await loadAttendance();
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <details className="roadmap-admin-session" onToggle={(event) => { if (event.currentTarget.open) loadAttendance(); }}>
    <summary><strong>{session.title}</strong><span>{formatSessionTime(session)} · {session.status} · {session.attendance?.attendanceCount || 0} attended</span></summary>
    <form className="roadmap-admin-session-form" onSubmit={save}>
      <label>Session title<input maxLength="140" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
      <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label>Instructor<input maxLength="120" value={form.instructor} onChange={(event) => setForm({ ...form, instructor: event.target.value })} /></label>
      <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value, status: 'rescheduled' })} /></label>
      <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value, status: 'rescheduled' })} /></label>
      <label>Attendance points<input type="number" min="0" step="any" value={form.attendancePoints} onChange={(event) => setForm({ ...form, attendancePoints: event.target.value })} /></label>
      <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="scheduled">Scheduled</option><option value="rescheduled">Rescheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      <label>Learning materials <small>One per line: title | https://...</small><textarea rows="3" value={form.materials} onChange={(event) => setForm({ ...form, materials: event.target.value })} /></label>
      <label>Problem sets <small>One per line: title | https://...</small><textarea rows="3" value={form.problemSets} onChange={(event) => setForm({ ...form, problemSets: event.target.value })} /></label>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {message && <div className="notice success-notice" role="status">{message}</div>}
      <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> Save session</button><button className="button button-outline" type="button" disabled={busy || !['scheduled', 'rescheduled'].includes(form.status)} onClick={createQr}><QrCode size={15} /> Generate check-in QR</button></div>
      {qr && <div className="roadmap-qr"><img src={qr.qrCodeDataUrl} alt={`Check-in QR for ${session.title}`} /><a href={qr.checkInUrl} target="_blank" rel="noreferrer">Open check-in link</a></div>}
    </form>
    <form className="roadmap-manual-attendance" onSubmit={addManualAttendance}><label>Record manual attendance<select value={studentId} onChange={(event) => setStudentId(event.target.value)} required><option value="">Select an enrolled student</option>{students.map(({ student }) => student && <option key={student._id} value={student._id}>{student.name} · {student.username || student.email}</option>)}</select></label><button className="button button-outline" disabled={busy || !students.length}>Record attendance</button></form>
    <h4>Attendance history</h4>
    {attendance.length ? attendance.map((item) => <div className="roadmap-attendance-row" key={item._id}>
      <span>{item.student?.name || 'Student'} · {item.recordedBy === 'admin' ? 'Manually recorded' : 'QR check-in'} · {eventDate(item.checkedInAt)}</span>
      <span>{item.pointsAwarded - (item.pointsReversed || 0)} / {item.pointsAwarded} pts</span>
      {!item.reversedAt && item.pointsAwarded > 0 && <button type="button" disabled={busy} onClick={() => reversePoints(item)}>Reverse points</button>}
    </div>) : <p>No attendance recorded yet.</p>}
  </details>;
}

export function AdminRoadmapsPage({ token }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapForm, setRoadmapForm] = useState({ title: '', description: '', coverImageUrl: '', objectives: '', audience: '', prerequisites: '', status: 'draft' });
  const [selectedRoadmapForm, setSelectedRoadmapForm] = useState(null);
  const [cycleForm, setCycleForm] = useState(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
  const [selectedRoadmap, setSelectedRoadmap] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [sessions, setSessions] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [preview, setPreview] = useState(null);
  const [editingCycleId, setEditingCycleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/admin/roadmaps', { token });
      setRoadmaps(result.roadmaps);
      if (!selectedRoadmap && result.roadmaps.length) setSelectedRoadmap(result.roadmaps[0]._id);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally { setLoading(false); }
  }, [selectedRoadmap, token]);
  useEffect(() => { loadRoadmaps(); }, [loadRoadmaps]);

  const loadSessions = useCallback(async () => {
    if (!selectedCycle) { setSessions([]); setEnrolledStudents([]); return; }
    try {
      const [sessionResult, enrollmentResult] = await Promise.all([
        api(`/admin/roadmap-cycles/${selectedCycle}/sessions`, { token }),
        api(`/admin/roadmap-cycles/${selectedCycle}/enrollments`, { token }),
      ]);
      setSessions(sessionResult.sessions);
      setEnrolledStudents(enrollmentResult.enrollments);
    } catch (reason) { setError(reason.message); }
  }, [selectedCycle, token]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const selected = roadmaps.find((roadmap) => roadmap._id === selectedRoadmap);
  const selectedCycleInfo = selected?.cycles?.find((cycle) => cycle._id === selectedCycle);
  useEffect(() => {
    if (!selected) {
      setSelectedRoadmapForm(null);
      return;
    }
    setSelectedRoadmapForm({
      title: selected.title,
      description: selected.description,
      coverImageUrl: selected.coverImageUrl || '',
      objectives: (selected.objectives || []).join('\n'),
      audience: selected.audience || '',
      prerequisites: selected.prerequisites || '',
    });
  }, [selected]);
  const saveRoadmap = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/admin/roadmaps', { method: 'POST', token, body: JSON.stringify({ ...roadmapForm, objectives: roadmapForm.objectives.split('\n').map((item) => item.trim()).filter(Boolean) }) });
      setRoadmapForm({ title: '', description: '', coverImageUrl: '', objectives: '', audience: '', prerequisites: '', status: 'draft' });
      setMessage('Roadmap created.');
      await loadRoadmaps();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const saveSelectedRoadmap = async (event) => {
    event.preventDefault();
    if (!selected || !selectedRoadmapForm) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/admin/roadmaps/${selected._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          ...selectedRoadmapForm,
          objectives: selectedRoadmapForm.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
        }),
      });
      setMessage('Roadmap details saved.');
      await loadRoadmaps();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const updateRoadmapStatus = async (roadmap, status) => {
    setBusy(true);
    setError('');
    try {
      await api(`/admin/roadmaps/${roadmap._id}`, { method: 'PUT', token, body: JSON.stringify({ status }) });
      setMessage(`Roadmap ${status}.`);
      await loadRoadmaps();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const editCycle = (cycle) => {
    setEditingCycleId(cycle._id);
    setCycleForm({
      ...cycle,
      objectives: (cycle.objectives || []).join('\n'),
      registrationOpensAt: new Date(new Date(cycle.registrationOpensAt).getTime() - new Date(cycle.registrationOpensAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      registrationClosesAt: new Date(new Date(cycle.registrationClosesAt).getTime() - new Date(cycle.registrationClosesAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      capacity: cycle.capacity ?? '',
    });
    setSelectedCycle(cycle._id);
    setPreview(null);
  };
  const saveCycle = async (event) => {
    event.preventDefault();
    if (!selectedRoadmap) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = toCyclePayload(cycleForm);
      const path = editingCycleId ? `/admin/roadmap-cycles/${editingCycleId}` : `/admin/roadmaps/${selectedRoadmap}/cycles`;
      await api(path, { method: editingCycleId ? 'PUT' : 'POST', token, body: JSON.stringify(body) });
      setMessage(editingCycleId ? 'Cycle settings saved. Review the schedule preview before applying any schedule changes.' : 'Cycle created.');
      setEditingCycleId('');
      await loadRoadmaps();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const loadPreview = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api(`/admin/roadmap-cycles/${selectedCycle}/schedule/preview`, { token });
      setPreview(result.preview);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const confirmSchedule = async () => {
    if (!preview || !window.confirm(`Apply this schedule? ${preview.additions} new, ${preview.reschedules} rescheduled, ${preview.cancellations} cancelled, ${preview.preserved} preserved.`)) return;
    setBusy(true);
    setError('');
    try {
      const result = await api(`/admin/roadmap-cycles/${selectedCycle}/schedule`, { method: 'POST', token, body: JSON.stringify({ confirmationToken: preview.confirmationToken }) });
      setMessage(`Schedule applied: ${result.summary.created} created, ${result.summary.rescheduled} rescheduled, ${result.summary.cancelled} cancelled, ${result.summary.preserved} preserved.`);
      setPreview(null);
      await loadSessions();
      await loadRoadmaps();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };

  return <main className="page-wrap roadmaps-admin-page">
    <div className="page-heading"><span className="eyebrow">ADMINISTRATION</span><h1>Roadmap <span>studio.</span></h1><p>Build learning paths, preview cycle schedules, and manage student sessions.</p></div>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {message && <div className="notice success-notice" role="status">{message}</div>}
    <section className="roadmap-admin-panel">
      <h2>Create a roadmap</h2>
      <form className="roadmap-admin-form" onSubmit={saveRoadmap}>
        <label>Title<input maxLength="140" required value={roadmapForm.title} onChange={(event) => setRoadmapForm({ ...roadmapForm, title: event.target.value })} /></label>
        <label>Description<textarea rows="3" maxLength="5000" required value={roadmapForm.description} onChange={(event) => setRoadmapForm({ ...roadmapForm, description: event.target.value })} /></label>
        <label>Cover image URL (optional)<input type="url" maxLength="500" value={roadmapForm.coverImageUrl} onChange={(event) => setRoadmapForm({ ...roadmapForm, coverImageUrl: event.target.value })} /></label>
        <label>Learning objectives <small>One per line</small><textarea rows="3" value={roadmapForm.objectives} onChange={(event) => setRoadmapForm({ ...roadmapForm, objectives: event.target.value })} /></label>
        <label>Expected audience<input value={roadmapForm.audience} onChange={(event) => setRoadmapForm({ ...roadmapForm, audience: event.target.value })} /></label>
        <label>Prerequisites<input value={roadmapForm.prerequisites} onChange={(event) => setRoadmapForm({ ...roadmapForm, prerequisites: event.target.value })} /></label>
        <button className="button button-dark" disabled={busy}><Plus size={15} /> Create draft roadmap</button>
      </form>
    </section>
    <section className="roadmap-admin-panel">
      <h2>Manage roadmaps</h2>
      {loading ? <LoadingState>Loading roadmap administration...</LoadingState> : roadmaps.length ? <div className="roadmap-admin-roadmap-list">{roadmaps.map((roadmap) => <article className={selectedRoadmap === roadmap._id ? 'roadmap-admin-roadmap selected' : 'roadmap-admin-roadmap'} key={roadmap._id}>
        <button type="button" className="roadmap-admin-roadmap-select" onClick={() => { setSelectedRoadmap(roadmap._id); setSelectedCycle(''); setPreview(null); }}><strong>{roadmap.title}</strong><span>{roadmap.status} · {roadmap.cycles.length} cycles</span></button>
        {roadmap.status !== 'archived' && <div className="roadmap-admin-actions">
          {roadmap.status === 'draft' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'published')}>Publish roadmap</button>}
          {roadmap.status === 'published' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'completed')}>Mark completed</button>}
          {roadmap.status !== 'archived' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'archived')}>Archive</button>}
        </div>}
      </article>)}</div> : <p>No roadmaps yet.</p>}
      {selected && selected.status !== 'archived' && selectedRoadmapForm && <form className="roadmap-admin-form roadmap-selected-form" onSubmit={saveSelectedRoadmap}>
        <h3>Edit {selected.title}</h3>
        <label>Title<input maxLength="140" required value={selectedRoadmapForm.title} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, title: event.target.value })} /></label>
        <label>Description<textarea rows="3" maxLength="5000" required value={selectedRoadmapForm.description} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, description: event.target.value })} /></label>
        <label>Cover image URL (optional)<input type="url" maxLength="500" value={selectedRoadmapForm.coverImageUrl} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, coverImageUrl: event.target.value })} /></label>
        <label>Objectives <small>One per line</small><textarea rows="3" value={selectedRoadmapForm.objectives} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, objectives: event.target.value })} /></label>
        <label>Audience<input value={selectedRoadmapForm.audience} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, audience: event.target.value })} /></label>
        <label>Prerequisites<input value={selectedRoadmapForm.prerequisites} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, prerequisites: event.target.value })} /></label>
        <button className="button button-dark" disabled={busy}><Save size={15} /> Save roadmap details</button>
      </form>}
    </section>
    {selected && selected.status !== 'archived' && <>
      <section className="roadmap-admin-panel">
        <h2>{editingCycleId ? 'Edit cycle settings' : `Add cycle to ${selected.title}`}</h2>
        <form className="roadmap-admin-form roadmap-cycle-form" onSubmit={saveCycle}>
          <label>Order<input type="number" min="1" required value={cycleForm.order} onChange={(event) => setCycleForm({ ...cycleForm, order: event.target.value })} /></label>
          <label>Cycle title<input maxLength="120" required value={cycleForm.title} onChange={(event) => setCycleForm({ ...cycleForm, title: event.target.value })} /></label>
          <label>Description<textarea rows="3" required value={cycleForm.description} onChange={(event) => setCycleForm({ ...cycleForm, description: event.target.value })} /></label>
          <label>Difficulty<select value={cycleForm.difficulty} onChange={(event) => setCycleForm({ ...cycleForm, difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>Objectives <small>One per line</small><textarea rows="3" value={cycleForm.objectives} onChange={(event) => setCycleForm({ ...cycleForm, objectives: event.target.value })} /></label>
          <label>Prerequisites<input value={cycleForm.prerequisites} onChange={(event) => setCycleForm({ ...cycleForm, prerequisites: event.target.value })} /></label>
          <label>Cycle start date<input type="date" required value={cycleForm.startDate} onChange={(event) => setCycleForm({ ...cycleForm, startDate: event.target.value })} /></label>
          <label>Cycle end date<input type="date" required value={cycleForm.endDate} onChange={(event) => setCycleForm({ ...cycleForm, endDate: event.target.value })} /></label>
          <label>Sessions per week<input type="number" min="1" max="7" required value={cycleForm.sessionsPerWeek} onChange={(event) => setCycleForm({ ...cycleForm, sessionsPerWeek: event.target.value })} /></label>
          <fieldset className="roadmap-weekdays"><legend>Training days (must match weekly frequency)</legend>{weekdays.map(([day, value]) => <label key={day}><input type="checkbox" checked={cycleForm.trainingDays.includes(value)} onChange={(event) => setCycleForm({ ...cycleForm, trainingDays: event.target.checked ? [...cycleForm.trainingDays, value] : cycleForm.trainingDays.filter((item) => item !== value) })} /> {day}</label>)}</fieldset>
          <label>Local start time<input type="time" required value={cycleForm.startTime} onChange={(event) => setCycleForm({ ...cycleForm, startTime: event.target.value })} /></label>
          <label>Duration (minutes)<input type="number" min="15" max="600" required value={cycleForm.sessionDurationMinutes} onChange={(event) => setCycleForm({ ...cycleForm, sessionDurationMinutes: event.target.value })} /></label>
          <label>Time zone (IANA)<input required maxLength="80" placeholder="Africa/Cairo" value={cycleForm.timeZone} onChange={(event) => setCycleForm({ ...cycleForm, timeZone: event.target.value })} /></label>
          <label>Registration opens<input type="datetime-local" required value={cycleForm.registrationOpensAt} onChange={(event) => setCycleForm({ ...cycleForm, registrationOpensAt: event.target.value })} /></label>
          <label>Registration closes<input type="datetime-local" required value={cycleForm.registrationClosesAt} onChange={(event) => setCycleForm({ ...cycleForm, registrationClosesAt: event.target.value })} /></label>
          <label>Capacity (optional)<input type="number" min="1" value={cycleForm.capacity} onChange={(event) => setCycleForm({ ...cycleForm, capacity: event.target.value })} /></label>
          <label>Points per attended session<input type="number" min="0" step="any" value={cycleForm.attendancePoints} onChange={(event) => setCycleForm({ ...cycleForm, attendancePoints: event.target.value })} /></label>
          <label>Cycle status<select value={cycleForm.status} onChange={(event) => setCycleForm({ ...cycleForm, status: event.target.value })}><option value="draft">Draft</option><option value="published" disabled={selected.status !== 'published'}>Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
          <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> {editingCycleId ? 'Save cycle' : 'Create cycle'}</button>{editingCycleId && <button type="button" className="button button-outline" onClick={() => { setEditingCycleId(''); setCycleForm(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')); }}>Cancel edit</button>}</div>
        </form>
      </section>
      <section className="roadmap-admin-panel">
        <h2>Cycles and sessions</h2>
        {selected.cycles?.length ? <div className="roadmap-admin-cycle-list">{selected.cycles.map((cycle) => <article className="roadmap-admin-cycle" key={cycle._id}>
          <div className="roadmap-admin-cycle-heading"><div><span className="category-label">{cycle.difficulty} · {cycle.status}</span><h3>{cycle.order}. {cycle.title}</h3><p>{cycle.startDate} – {cycle.endDate} · {cycle.sessionsPerWeek} / week · {cycle.enrollmentCount}{cycle.capacity ? `/${cycle.capacity}` : ''} enrolled</p></div>
            <div className="roadmap-admin-actions"><button type="button" className="button button-outline" onClick={() => editCycle(cycle)}>Edit cycle</button><button type="button" className="button button-outline" onClick={() => { setSelectedCycle(cycle._id); setPreview(null); }}>Manage sessions</button></div>
          </div>
        </article>)}</div> : <p>Create a cycle to define its schedule and enrollment window.</p>}
      </section>
    </>}
    {selectedCycleInfo && <section className="roadmap-admin-panel">
      <div className="roadmap-admin-cycle-heading"><div><span className="eyebrow">SCHEDULE GENERATION</span><h2>{selectedCycleInfo.title}</h2></div><div className="roadmap-admin-actions"><button type="button" className="button button-outline" disabled={busy} onClick={loadPreview}>Preview schedule</button>{preview && <button type="button" className="button button-dark" disabled={busy} onClick={confirmSchedule}>Confirm and generate</button>}</div></div>
      {preview && <div className="roadmap-schedule-preview"><p>{preview.proposedCount} proposed sessions · {preview.additions} new · {preview.reschedules} rescheduled · {preview.cancellations} cancelled · {preview.preserved} protected</p><div className="roadmap-preview-list">{preview.changes.map((change) => <span key={`${change.ordinal}-${change.action}`}>{change.action}: Session {change.ordinal} · {change.startsAt ? formatSessionTime({ startsAt: change.startsAt, timeZone: selectedCycleInfo.timeZone }) : '—'}</span>)}</div></div>}
      <div className="roadmap-enrolled-list"><h3>Enrolled students · {enrolledStudents.length}</h3>{enrolledStudents.length ? enrolledStudents.map(({ _id, student }) => student && <span key={_id}>{student.name} · {student.username || student.email}</span>) : <p>No students enrolled yet.</p>}</div>
      <div className="roadmap-admin-session-list">{sessions.map((session) => <AdminSession key={session._id} token={token} session={session} students={enrolledStudents} refresh={loadSessions} />)}</div>
    </section>}
    {loading && <LoadingState>Loading roadmap administration...</LoadingState>}
  </main>;
}
