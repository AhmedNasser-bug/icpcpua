import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
export function AdminOverviewPage({
  token
}) {
  const [events, setEvents] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([api('/admin/events', {
      token
    }), api('/admin/roadmaps', {
      token
    })]).then(([eventResult, roadmapResult]) => {
      if (!active) return;
      setEvents(eventResult.events);
      setRoadmaps(roadmapResult.roadmaps);
      setError('');
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);
  const now = Date.now();
  const upcomingEvents = events.filter(event => event.status === 'published' && new Date(event.startsAt).getTime() >= now);
  const cycleCount = roadmaps.reduce((total, roadmap) => total + roadmap.cycles.length, 0);
  const registrationCount = events.reduce((total, event) => total + (event.registrationCount || 0), 0);
  const attendanceCount = events.reduce((total, event) => total + (event.attendanceCount || 0), 0);
  const pointsAwarded = events.reduce((total, event) => total + (event.totalPointsAwarded || 0), 0);
  const nextEvents = upcomingEvents.slice().sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt)).slice(0, 5);
  return <main className="page-wrap admin-overview-page">
    <div className="page-heading"><h2>Welcome to the <span>control room</span></h2></div>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading administration overview...</div> : !error && <>
      <section className="admin-overview-stats" aria-label="Administration statistics">
        <article className="admin-overview-stat"><span>All events</span><strong>{events.length}</strong></article>
        <article className="admin-overview-stat"><span>Upcoming events</span><strong>{upcomingEvents.length}</strong></article>
        <article className="admin-overview-stat"><span>Roadmaps</span><strong>{roadmaps.length}</strong></article>
        <article className="admin-overview-stat"><span>Cycles</span><strong>{cycleCount}</strong></article>
      </section>
      <section className="admin-overview-activity">
        <div className="admin-overview-section-heading"><div><span className="eyebrow">CONTEST ACTIVITY</span><h3>Registration &amp; attendance</h3></div><Trophy size={20} /></div>
        <div className="admin-overview-metrics"><p><strong>{registrationCount}</strong><span>Registrations</span></p><p><strong>{attendanceCount}</strong><span>Attended</span></p><p><strong>{pointsAwarded}</strong><span>Points awarded</span></p></div>
      </section>
      <section className="admin-overview-upcoming">
        <div className="admin-overview-section-heading"><div><span className="eyebrow">SCHEDULE</span><h3>Upcoming events</h3></div><Link className="text-link" to="/admin/events">Manage events <ArrowRight size={15} /></Link></div>
        {nextEvents.length ? <div className="admin-overview-event-list">{nextEvents.map(event => <article key={event.id}>
          <div><strong>{event.title}</strong><span>{event.category} · {event.mode === 'offline' ? event.location : 'Online'}</span></div>
          <time dateTime={event.startsAt}>{eventDate(event.startsAt)}</time>
        </article>)}</div> : <p className="muted">No upcoming published events.</p>}
      </section>
      <section className="admin-overview-quick-links" aria-label="Management shortcuts">
        <Link className="button button-dark" to="/admin/events">Manage events <ArrowRight size={16} /></Link>
        <Link className="button button-outline" to="/admin/roadmaps">Manage roadmaps <ArrowRight size={16} /></Link>
        <Link className="button button-outline" to="/admin/cycles">Manage cycles <ArrowRight size={16} /></Link>
      </section>
    </>}
  </main>;
}
