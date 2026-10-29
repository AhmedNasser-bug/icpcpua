import { useCallback, useEffect, useState } from "react";
import { QrCode, Users, X } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { safeExternalUrl } from '../../../shared/utils/externalUrl.js';
import { dateTimeLocal } from '../../events/utils/dateTimeLocal.js';
function EventForm({
  token,
  event,
  onSaved,
  onCancel
}) {
  const [form, setForm] = useState(event ? {
    title: event.title,
    description: event.description,
    coverImageUrl: event.coverImageUrl || '',
    category: event.category,
    startsAt: dateTimeLocal(event.startsAt),
    endsAt: dateTimeLocal(event.endsAt),
    registrationDeadline: dateTimeLocal(event.registrationDeadline),
    attendancePoints: event.attendancePoints ?? 0,
    mode: event.mode,
    location: event.location || '',
    capacity: event.capacity ?? '',
    status: event.status
  } : {
    title: '',
    description: '',
    coverImageUrl: '',
    category: 'Training',
    startsAt: '',
    endsAt: '',
    registrationDeadline: '',
    attendancePoints: 0,
    mode: 'online',
    location: '',
    capacity: '',
    status: 'draft'
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm(current => ({
    ...current,
    [key]: value
  }));
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      ...form,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      registrationDeadline: form.registrationDeadline || null,
      attendancePoints: Number(form.attendancePoints)
    };
    try {
      await api(event ? `/admin/events/${event.id}` : '/admin/events', {
        method: event ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(body)
      });
      onSaved();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  return <form className="admin-form" onSubmit={submit}>
    <h2>{event ? 'Edit event' : 'Create an event'}</h2>
    <div className="form-grid">
      <label className="span-two">Event title<input required maxLength="140" value={form.title} onChange={e => update('title', e.target.value)} /></label>
      <label className="span-two">Cover image URL (optional)<input type="url" maxLength="500" placeholder="https://example.com/event-cover.jpg" value={form.coverImageUrl} onChange={e => update('coverImageUrl', e.target.value)} /><small>Use a publicly accessible HTTP or HTTPS image URL.</small>{safeExternalUrl(form.coverImageUrl) && <img className="event-cover-preview" src={safeExternalUrl(form.coverImageUrl)} alt="Event cover preview" onError={e => e.currentTarget.remove()} />}</label>
      <label>Category<input required value={form.category} onChange={e => update('category', e.target.value)} /></label>
      <label>Format<select value={form.mode} onChange={e => update('mode', e.target.value)}><option value="online">Online</option><option value="offline">In person</option></select></label>
      <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={e => update('startsAt', e.target.value)} /></label>
      <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={e => update('endsAt', e.target.value)} /></label>
      <label>Attendance points<input type="number" min="0" step="any" required value={form.attendancePoints} onChange={e => update('attendancePoints', e.target.value)} /></label>
      {form.mode === 'offline' && <label className="span-two">Location<input required value={form.location} onChange={e => update('location', e.target.value)} /></label>}
      <label>Registration deadline (optional)<input type="datetime-local" value={form.registrationDeadline} onChange={e => update('registrationDeadline', e.target.value)} /></label>
      <label>Capacity (optional)<input type="number" min="1" value={form.capacity} onChange={e => update('capacity', e.target.value)} /></label>
      <label>Status<select value={form.status} onChange={e => update('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label>
      <label className="span-two">Description<textarea required rows="4" value={form.description} onChange={e => update('description', e.target.value)} /></label>
    </div>
    {error && <div className="notice error-notice">{error}</div>}
    <div className="form-actions"><button className="button button-dark" disabled={busy}>{busy ? 'Saving...' : event ? 'Save changes' : 'Create event'}</button><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button></div>
  </form>;
}
export function Admin({
  token
}) {
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
      const {
        events: result
      } = await api('/admin/events', {
        token
      });
      setEvents(result);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);
  const loadAttendees = async event => {
    setSelected(event);
    try {
      const {
        registrations
      } = await api(`/admin/events/${event.id}/registrations`, {
        token
      });
      setAttendees(registrations);
    } catch (reason) {
      setError(reason.message);
    }
  };
  const generateEventQr = async event => {
    setQrLoadingId(event.id);
    setQrError('');
    try {
      const result = await api(`/admin/events/${event.id}/check-in-qr`, {
        method: 'POST',
        token
      });
      setQrDisplay(result);
    } catch (reason) {
      setQrError(reason.message);
    } finally {
      setQrLoadingId('');
    }
  };
  const deleteEvent = async event => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api(`/admin/events/${event.id}`, {
        method: 'DELETE',
        token,
        body: JSON.stringify({
          confirmationName
        })
      });
      setEventToDelete(null);
      setConfirmationName('');
      setQrDisplay(current => current?.event.id === event.id ? null : current);
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
  if (editing !== undefined) return <main className="page-wrap"><EventForm token={token} event={editing} onSaved={() => {
      setEditing(undefined);
      loadEvents();
    }} onCancel={() => setEditing(undefined)} /></main>;
  return <main className="page-wrap admin-page">
      <div className="page-heading admin-heading"><div><h1>Event <span>admin</span></h1></div><button className="button button-dark" onClick={() => setEditing(null)}>+ Create event</button></div>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      <div className="admin-grid">
        <section className="admin-panel"><h2>All events <span>{events.length}</span></h2>
          {loading ? <p className="muted">Loading events...</p> : events.map(event => <div className="admin-event-row" key={event.id}><div><b>{event.title}</b><span>{eventDate(event.startsAt)} · {event.attendanceCount || 0}/{event.registrationCount} attended · {event.totalPointsAwarded || 0} pts awarded · {event.attendancePoints ?? 0} pts per attendee</span></div><span className={`status-pill status-${event.status}`}>{event.status}</span><div className="admin-row-actions"><button className="small-button" disabled={event.status === 'deleted'} onClick={() => setEditing(event)}>Edit</button><button className="small-button" onClick={() => loadAttendees(event)}>Attendees</button><button className="small-button" disabled={event.status !== 'published' || qrLoadingId === event.id} onClick={() => generateEventQr(event)}>{qrLoadingId === event.id ? 'Generating...' : 'Event QR'}</button><button className="small-button delete-event-button" disabled={event.status === 'deleted'} onClick={() => {
              setEventToDelete(event);
              setConfirmationName('');
              setDeleteError('');
            }}>Delete</button></div></div>)}
          {!loading && !events.length && <p className="muted">No events yet. Create your first event.</p>}
          {qrError && <div className="notice error-notice">{qrError}</div>}
        </section>
        <section className="admin-panel">
          <h2>Attendance <Users size={18} /></h2>
          {!selected && <p className="muted">Choose attendees on an event to review attendance and points.</p>}
          {selected && <div className="attendee-list"><h3>{selected.title} <span>{attendees.length} people</span></h3><p className="attendance-summary">{attendees.filter(item => item.checkedInAt).length} attended · {attendees.reduce((total, item) => total + (item.pointsAwarded || 0), 0)} total points awarded</p>{attendees.map(attendee => <div className="attendee-row" key={attendee.id}><div><b>{attendee.user.name}</b><span>{attendee.user.email}</span></div><span className={attendee.checkedInAt ? 'check-status done' : 'check-status'}>{attendee.checkedInAt ? `${eventDate(attendee.checkedInAt)} · ${attendee.pointsAwarded} pts` : 'Registered'}</span></div>)}</div>}
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
        <form className="delete-event-dialog" onSubmit={e => {
        e.preventDefault();
        deleteEvent(eventToDelete);
      }}>
          <button type="button" className="qr-display-close" aria-label="Cancel event deletion" disabled={deleting} onClick={closeDeleteDialog}><X size={22} /></button>
          <span className="eyebrow">CONFIRM EVENT DELETION</span>
          <h2 id="delete-dialog-title">Delete this event?</h2>
          <p><b>{eventToDelete.title}</b> will be removed from public events and its check-in QR will stop working. Existing attendance and awarded points will be preserved.</p>
          <label htmlFor="delete-event-confirmation">Type the event name to continue</label>
          <input id="delete-event-confirmation" autoComplete="off" value={confirmationName} onChange={e => setConfirmationName(e.target.value)} placeholder={eventToDelete.title} required />
          {deleteError && <div className="notice error-notice" role="alert">{deleteError}</div>}
          <div className="delete-dialog-actions"><button type="button" className="button button-outline" disabled={deleting} onClick={closeDeleteDialog}>Cancel</button><button className="button delete-confirm-button" disabled={deleting || confirmationName !== eventToDelete.title}>{deleting ? 'Deleting...' : 'Delete event'}</button></div>
        </form>
      </div>}
    </main>;
}
