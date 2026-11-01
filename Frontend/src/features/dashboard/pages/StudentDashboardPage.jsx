import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, ShieldCheck, Trophy } from 'lucide-react';
import { api, eventDate } from '../../../shared/services/api.js';

function VerificationCard() {
  return <section className="student-dashboard-verification" aria-labelledby="student-dashboard-verification-title">
    <span className="student-dashboard-verification-icon"><ShieldCheck size={26} aria-hidden="true" /></span>
    <h2 id="student-dashboard-verification-title">Verify your Codeforces account</h2>
    <p>Verify your Codeforces account to unlock your points, attendance, and training overview</p>
    <Link className="button button-dark" to="/settings/codeforces">Verify Codeforces account <ArrowRight size={17} aria-hidden="true" /></Link>
  </section>;
}

export function StudentDashboardPage({ session }) {
  const isVerified = session.user?.profile?.codeforcesVerification?.status === 'verified';
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(isVerified);
  const [error, setError] = useState('');
  const [verificationBlocked, setVerificationBlocked] = useState(!isVerified);
  const [retry, setRetry] = useState(0);

  const loadDashboard = useCallback(async () => {
    if (!isVerified) {
      setDashboard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { dashboard: result } = await api('/dashboard', { token: session.token });
      setDashboard(result);
      setVerificationBlocked(false);
    } catch (reason) {
      setDashboard(null);
      if (reason.code === 'CODEFORCES_VERIFICATION_REQUIRED') {
        setVerificationBlocked(true);
        setError('');
      } else {
        setError(reason.message);
      }
    } finally {
      setLoading(false);
    }
  }, [isVerified, retry, session.token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (session.user?.role === 'admin') return <Navigate to="/admin/overview" replace />;
  const needsVerification = !isVerified || verificationBlocked;
  const showVerified = isVerified && !verificationBlocked;

  return <main className="page-wrap student-dashboard-page">
    <header className="student-dashboard-hero">
      <div><h1>Student dashboard</h1></div>
      <span className={`student-dashboard-status${showVerified ? ' is-verified' : ''}`}>{showVerified ? <><CheckCircle2 size={16} /> Verified account</> : <><ShieldCheck size={16} /> Verification required</>}</span>
    </header>

    {needsVerification ? <VerificationCard /> : loading ? <div className="empty-state"><span className="loader" /> Loading your dashboard...</div> : error ? <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : dashboard && <>
      <section className="student-dashboard-stats" aria-label="Your community statistics">
        <article><span><Trophy size={18} aria-hidden="true" /></span><small>Total points</small><strong>{dashboard.stats.points.toLocaleString()}</strong><Link to="/settings/points">Points history <ArrowRight size={14} /></Link></article>
        <article><span><CalendarDays size={18} aria-hidden="true" /></span><small>Events attended</small><strong>{dashboard.stats.eventsAttended.toLocaleString()}</strong><Link to="/events">Explore events <ArrowRight size={14} /></Link></article>
        <article><span><BookOpen size={18} aria-hidden="true" /></span><small>Training cycles</small><strong>{dashboard.stats.trainingCycles.toLocaleString()}</strong><Link to="/training">Open training <ArrowRight size={14} /></Link></article>
      </section>

      <div className="student-dashboard-content">
        <section className="student-dashboard-panel" aria-labelledby="student-dashboard-cycles-title">
          <div className="student-dashboard-panel-heading"><div><span className="eyebrow">KEEP LEARNING</span><h2 id="student-dashboard-cycles-title">Your training cycles</h2></div><Link to="/training">View training <ArrowRight size={15} /></Link></div>
          {dashboard.cycles.length ? <div className="student-dashboard-cycle-list">{dashboard.cycles.map(cycle => <article key={cycle.id}>
            <span className="student-dashboard-cycle-icon"><BookOpen size={18} aria-hidden="true" /></span>
            <div className="student-dashboard-cycle-copy"><small>{cycle.roadmapTitle}</small><strong>{cycle.title}</strong><span>{cycle.progress.completedSessions} of {cycle.progress.totalSessions} sessions completed</span>
              {cycle.nextSession && <span className="student-dashboard-next-session"><Clock3 size={14} aria-hidden="true" /> Next: {cycle.nextSession.title} · {eventDate(cycle.nextSession.startsAt, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
            </div>
            <Link to={`/roadmaps/${encodeURIComponent(cycle.roadmapSlug)}/cycles/${encodeURIComponent(cycle.id)}`} aria-label={`Open ${cycle.title}`}><ArrowRight size={17} /></Link>
          </article>)}</div> : <p className="student-dashboard-empty">You haven’t joined a training cycle yet. Browse current cycles to find your next learning goal.</p>}
          <Link className="button button-outline" to="/training">Browse training cycles <ArrowRight size={16} /></Link>
        </section>

        <section className="student-dashboard-panel" aria-labelledby="student-dashboard-attendance-title">
          <div className="student-dashboard-panel-heading"><div><span className="eyebrow">COMMUNITY</span><h2 id="student-dashboard-attendance-title">Recent attendance</h2></div><Link to="/settings/points">Points history <ArrowRight size={15} /></Link></div>
          {dashboard.recentAttendance.length ? <div className="student-dashboard-attendance-list">{dashboard.recentAttendance.map((item, index) => <article key={`${item.event.id}-${item.checkedInAt}-${index}`}>
            <span className="student-dashboard-attendance-icon"><CheckCircle2 size={17} aria-hidden="true" /></span><div><strong>{item.event.title}</strong><small>{eventDate(item.checkedInAt, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div><b>+{item.pointsAwarded} pts</b>
          </article>)}</div> : <p className="student-dashboard-empty">Your checked-in community events will appear here.</p>}
          <Link className="button button-outline" to="/events">Discover events <ArrowRight size={16} /></Link>
        </section>
      </div>
    </>}
  </main>;
}
