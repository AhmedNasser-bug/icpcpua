import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Plus, QrCode, Save, X } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { LearningPath } from '../components/LearningPath.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { weekdays, formatSessionTime, formatDateTimeInput, dateTimeInputToIso, formatProblems, parseProblems, emptyCycleForm, toCyclePayload, formatResources, parseResources } from '../utils/roadmapUtils.js';
function AdminSession({
  token,
  session,
  students,
  refresh
}) {
  const [form, setForm] = useState({
    title: session.title,
    description: session.description || '',
    instructor: session.instructor || '',
    status: session.status,
    attendancePoints: session.attendancePoints,
    materials: formatResources(session.materials),
    problemSets: formatResources(session.problemSets),
    startsAt: formatDateTimeInput(session.startsAt, session.timeZone),
    endsAt: formatDateTimeInput(session.endsAt, session.timeZone)
  });
  const [attendance, setAttendance] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const loadAttendance = async () => {
    try {
      const result = await api(`/admin/roadmap-sessions/${session._id}/attendance`, {
        token
      });
      setAttendance(result.attendance);
    } catch (reason) {
      setError(reason.message);
    }
  };
  const save = async event => {
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
        problemSets: parseResources(form.problemSets)
      };
      await api(`/admin/roadmap-sessions/${session._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(body)
      });
      setMessage('Session saved.');
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const createQr = async () => {
    setBusy(true);
    setError('');
    try {
      setQr(await api(`/admin/roadmap-sessions/${session._id}/check-in-qr`, {
        method: 'POST',
        token
      }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const addManualAttendance = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/admin/roadmap-sessions/${session._id}/attendance`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          studentId
        })
      });
      setStudentId('');
      setMessage('Manual attendance recorded with this session’s configured points.');
      await loadAttendance();
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const reversePoints = async item => {
    const reason = window.prompt('Reason for reversing this points award:');
    if (!reason?.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api(`/admin/roadmap-sessions/${session._id}/attendance/${item._id}/reverse-points`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          reason
        })
      });
      setMessage('Points reversed. The attendance record remains in the audit history.');
      await loadAttendance();
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return <details className="roadmap-admin-session" onToggle={event => {
    if (event.currentTarget.open) loadAttendance();
  }}>
    <summary><strong>{session.title}</strong><span>{formatSessionTime(session)} · {session.status} · {session.attendance?.attendanceCount || 0} attended</span></summary>
    <form className="roadmap-admin-session-form" onSubmit={save}>
      <label>Session title<input maxLength="140" value={form.title} onChange={event => setForm({
          ...form,
          title: event.target.value
        })} required /></label>
      <label>Description<textarea rows="3" value={form.description} onChange={event => setForm({
          ...form,
          description: event.target.value
        })} /></label>
      <label>Instructor<input maxLength="120" value={form.instructor} onChange={event => setForm({
          ...form,
          instructor: event.target.value
        })} /></label>
      <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={event => setForm({
          ...form,
          startsAt: event.target.value,
          status: 'rescheduled'
        })} /></label>
      <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={event => setForm({
          ...form,
          endsAt: event.target.value,
          status: 'rescheduled'
        })} /></label>
      <label>Attendance points<input type="number" min="0" step="any" value={form.attendancePoints} onChange={event => setForm({
          ...form,
          attendancePoints: event.target.value
        })} /></label>
      <label>Status<select value={form.status} onChange={event => setForm({
          ...form,
          status: event.target.value
        })}><option value="scheduled">Scheduled</option><option value="rescheduled">Rescheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      <label>Learning materials <small>One URL per line, or title | https://...</small><textarea rows="3" value={form.materials} onChange={event => setForm({
          ...form,
          materials: event.target.value
        })} /></label>
      <label>Problem sets <small>One URL per line, or title | https://...</small><textarea rows="3" value={form.problemSets} onChange={event => setForm({
          ...form,
          problemSets: event.target.value
        })} /></label>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {message && <div className="notice success-notice" role="status">{message}</div>}
      <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> Save session</button><button className="button button-outline" type="button" disabled={busy || !['scheduled', 'rescheduled'].includes(form.status)} onClick={createQr}><QrCode size={15} /> Generate check-in QR</button></div>
      {qr && <div className="roadmap-qr"><img src={qr.qrCodeDataUrl} alt={`Check-in QR for ${session.title}`} /><a href={qr.checkInUrl} target="_blank" rel="noreferrer">Open check-in link</a></div>}
    </form>
    <form className="roadmap-manual-attendance" onSubmit={addManualAttendance}><label>Record manual attendance<select value={studentId} onChange={event => setStudentId(event.target.value)} required><option value="">Select an enrolled student</option>{students.map(({
            student
          }) => student && <option key={student._id} value={student._id}>{student.name} · {student.username || student.email}</option>)}</select></label><button className="button button-outline" disabled={busy || !students.length}>Record attendance</button></form>
    <h4>Attendance history</h4>
    {attendance.length ? attendance.map(item => <div className="roadmap-attendance-row" key={item._id}>
      <span>{item.student?.name || 'Student'} · {item.recordedBy === 'admin' ? 'Manually recorded' : 'QR check-in'} · {eventDate(item.checkedInAt)}</span>
      <span>{item.pointsAwarded - (item.pointsReversed || 0)} / {item.pointsAwarded} pts</span>
      {!item.reversedAt && item.pointsAwarded > 0 && <button type="button" disabled={busy} onClick={() => reversePoints(item)}>Reverse points</button>}
    </div>) : <p>No attendance recorded yet.</p>}
  </details>;
}
export function AdminCyclesPage({
  token
}) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapId, setRoadmapId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/admin/roadmaps', {
        token
      });
      setRoadmaps(result.roadmaps);
      setRoadmapId(current => current || result.roadmaps[0]?._id || '');
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);
  const cycles = roadmaps.flatMap(roadmap => (roadmap.cycles || []).map(cycle => ({
    ...cycle,
    roadmap
  })));
  const filteredCycles = cycles.filter(cycle => {
    const matchesQuery = `${cycle.title} ${cycle.roadmap.title}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === 'all' || cycle.status === status);
  });
  return <main className="page-wrap admin-cycles-page">
    <div className="page-heading roadmap-studio-heading">
      <div><h1>Training cycles</h1></div>
      <div className="admin-cycle-create">
        <label htmlFor="admin-cycle-roadmap">Create cycle for</label>
        <select id="admin-cycle-roadmap" value={roadmapId} onChange={event => setRoadmapId(event.target.value)} disabled={!roadmaps.length}>
          {!roadmaps.length && <option value="">No roadmaps available</option>}
          {roadmaps.map(roadmap => <option key={roadmap._id} value={roadmap._id}>{roadmap.title}</option>)}
        </select>
        {roadmapId && <Link className="button button-dark" to={`/admin/roadmaps/${roadmapId}/cycles/new`}><Plus size={16} /> Create cycle</Link>}
      </div>
    </div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={loadRoadmaps}>Try again</button></div>}
    <div className="roadmap-studio-filters admin-cycle-filters">
      <label>Search cycles<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cycle or roadmap title" /></label>
      <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
    </div>
    {loading ? <LoadingState>Loading training cycles...</LoadingState> : filteredCycles.length ? <div className="admin-cycle-list">
      {filteredCycles.map(cycle => <article className="admin-cycle-row" key={cycle._id}>
        <div className="admin-cycle-order">{cycle.order}</div>
        <div className="admin-cycle-copy">
          <span className={`roadmap-studio-status status-${cycle.status}`}>{cycle.difficulty} · {cycle.status}</span>
          <h2>{cycle.title}</h2>
          <p><Link to={`/admin/roadmaps/${cycle.roadmap._id}`}>{cycle.roadmap.title}</Link></p>
          <small>{cycle.startDate} – {cycle.endDate} · {cycle.sessionsPerWeek} sessions / week · {cycle.enrollmentCount || 0}{cycle.capacity ? `/${cycle.capacity}` : ''} enrolled</small>
        </div>
        <div className="admin-cycle-actions">
          {cycle.status !== 'archived' && <Link className="button button-outline" to={`/admin/roadmaps/${cycle.roadmap._id}/cycles/${cycle._id}/edit`}>Edit cycle</Link>}
          <Link className="button button-dark" to={`/admin/roadmaps/${cycle.roadmap._id}/cycles/${cycle._id}/sessions`}>Manage sessions</Link>
        </div>
      </article>)}
    </div> : <div className="empty-state"><h2>{cycles.length ? 'No cycles match these filters.' : 'No training cycles yet.'}</h2><p>{cycles.length ? 'Try another search or status.' : 'Create a cycle from a roadmap using the selector above.'}</p>{!cycles.length && !roadmaps.length && <Link className="button button-dark" to="/admin/roadmaps">Create a roadmap first <ArrowRight size={16} /></Link>}</div>}
  </main>;
}
export function AdminRoadmapsPage({
  token
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeParts = location.pathname.split('/').filter(Boolean).slice(2);
  const routeRoadmapId = routeParts[0] && routeParts[0] !== 'new' ? routeParts[0] : '';
  const routeSection = routeParts[0] === 'new' ? 'create-roadmap' : !routeRoadmapId ? 'list' : routeParts[1] === 'settings' ? 'settings' : routeParts[1] === 'nodes' ? 'nodes' : routeParts[1] === 'cycles' ? routeParts[2] === 'new' || routeParts[3] === 'edit' ? 'cycle-form' : routeParts[3] === 'sessions' ? 'sessions' : 'cycles' : 'overview';
  const routeCycleId = routeParts[1] === 'cycles' && routeParts[2] !== 'new' ? routeParts[2] || '' : '';
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    difficulty: 'beginner',
    estimatedDuration: '',
    objectives: '',
    audience: '',
    prerequisites: '',
    status: 'draft'
  });
  const [selectedRoadmapForm, setSelectedRoadmapForm] = useState(null);
  const [cycleForm, setCycleForm] = useState(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
  const [selectedRoadmap, setSelectedRoadmap] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [sessions, setSessions] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [nodeForm, setNodeForm] = useState({
    title: '',
    description: '',
    dependencies: [],
    position: 0,
    estimatedHours: '',
    isRequired: true,
    resources: '',
    problems: ''
  });
  const [editingNodeId, setEditingNodeId] = useState('');
  const [nodeSaving, setNodeSaving] = useState(false);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [preview, setPreview] = useState(null);
  const [editingCycleId, setEditingCycleId] = useState('');
  const [roadmapSearch, setRoadmapSearch] = useState('');
  const [roadmapStatusFilter, setRoadmapStatusFilter] = useState('all');
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [cycleArchiveTarget, setCycleArchiveTarget] = useState(null);
  const [cycleArchiveConfirmation, setCycleArchiveConfirmation] = useState('');
  const [cycleArchiveError, setCycleArchiveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/admin/roadmaps', {
        token
      });
      setRoadmaps(result.roadmaps);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);
  useEffect(() => {
    setSelectedRoadmap(routeRoadmapId);
    const activeSessionCycleId = routeSection === 'sessions' ? routeCycleId : '';
    setSelectedCycle(activeSessionCycleId);
    if (!activeSessionCycleId) {
      setSessions([]);
      setEnrolledStudents([]);
      setPreview(null);
    }
  }, [routeCycleId, routeRoadmapId, routeSection]);
  const loadSessions = useCallback(async () => {
    if (!selectedCycle) {
      setSessions([]);
      setEnrolledStudents([]);
      return;
    }
    setSessionsLoading(true);
    try {
      const [sessionResult, enrollmentResult] = await Promise.all([api(`/admin/roadmap-cycles/${selectedCycle}/sessions`, {
        token
      }), api(`/admin/roadmap-cycles/${selectedCycle}/enrollments`, {
        token
      })]);
      setSessions(sessionResult.sessions);
      setEnrolledStudents(enrollmentResult.enrollments);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSessionsLoading(false);
    }
  }, [selectedCycle, token]);
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  const loadNodes = useCallback(async () => {
    if (!routeRoadmapId || routeSection !== 'nodes') {
      setNodes([]);
      return;
    }
    setNodesLoading(true);
    try {
      const result = await api(`/admin/roadmaps/${routeRoadmapId}/nodes`, {
        token
      });
      setNodes(result.nodes);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setNodesLoading(false);
    }
  }, [routeRoadmapId, routeSection, token]);
  useEffect(() => {
    loadNodes();
  }, [loadNodes]);
  const selected = roadmaps.find(roadmap => roadmap._id === selectedRoadmap);
  const selectedCycleInfo = selected?.cycles?.find(cycle => cycle._id === selectedCycle);
  useEffect(() => {
    if (!selected) {
      setSelectedRoadmapForm(null);
      return;
    }
    setSelectedRoadmapForm({
      title: selected.title,
      description: selected.description,
      coverImageUrl: selected.coverImageUrl || '',
      difficulty: selected.difficulty || 'beginner',
      estimatedDuration: selected.estimatedDuration || '',
      objectives: (selected.objectives || []).join('\n'),
      audience: selected.audience || '',
      prerequisites: selected.prerequisites || ''
    });
  }, [selected]);
  useEffect(() => {
    if (routeSection !== 'cycle-form' || !routeCycleId || !selected) return;
    const cycle = selected.cycles.find(item => item._id === routeCycleId);
    if (!cycle || editingCycleId === cycle._id) return;
    setEditingCycleId(cycle._id);
    setCycleForm({
      ...cycle,
      objectives: (cycle.objectives || []).join('\n'),
      registrationOpensAt: new Date(new Date(cycle.registrationOpensAt).getTime() - new Date(cycle.registrationOpensAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      registrationClosesAt: new Date(new Date(cycle.registrationClosesAt).getTime() - new Date(cycle.registrationClosesAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      capacity: cycle.capacity ?? ''
    });
  }, [editingCycleId, routeCycleId, routeSection, selected]);
  const saveRoadmap = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/admin/roadmaps', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...roadmapForm,
          objectives: roadmapForm.objectives.split('\n').map(item => item.trim()).filter(Boolean)
        })
      });
      setRoadmapForm({
        title: '',
        description: '',
        coverImageUrl: '',
        difficulty: 'beginner',
        estimatedDuration: '',
        objectives: '',
        audience: '',
        prerequisites: '',
        status: 'draft'
      });
      setMessage('Roadmap created.');
      await loadRoadmaps();
      navigate('/admin/roadmaps');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const saveSelectedRoadmap = async event => {
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
          objectives: selectedRoadmapForm.objectives.split('\n').map(item => item.trim()).filter(Boolean)
        })
      });
      setMessage('Roadmap details saved.');
      await loadRoadmaps();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const editNode = node => {
    setEditingNodeId(node._id);
    setNodeForm({
      title: node.title,
      description: node.description || '',
      dependencies: (node.dependencies || []).map(String),
      position: node.position ?? 0,
      estimatedHours: node.estimatedHours ?? '',
      isRequired: node.isRequired !== false,
      resources: formatResources(node.resources || []),
      problems: formatProblems(node.problems || [])
    });
  };
  const resetNodeForm = () => {
    setEditingNodeId('');
    setNodeForm({
      title: '',
      description: '',
      dependencies: [],
      position: nodes.length,
      estimatedHours: '',
      isRequired: true,
      resources: '',
      problems: ''
    });
  };
  const saveNode = async event => {
    event.preventDefault();
    if (!selected) return;
    setNodeSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...nodeForm,
        position: Number(nodeForm.position),
        estimatedHours: nodeForm.estimatedHours === '' ? null : Number(nodeForm.estimatedHours),
        resources: parseResources(nodeForm.resources),
        problems: parseProblems(nodeForm.problems)
      };
      await api(`/admin/roadmaps/${selected._id}/nodes${editingNodeId ? `/${editingNodeId}` : ''}`, {
        method: editingNodeId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload)
      });
      setMessage(editingNodeId ? 'Learning topic updated.' : 'Learning topic added.');
      resetNodeForm();
      await loadNodes();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setNodeSaving(false);
    }
  };
  const removeNode = async node => {
    if (!selected || !window.confirm(`Delete "${node.title}"? Topics depending on it will remain and their prerequisite link will be removed.`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/admin/roadmaps/${selected._id}/nodes/${node._id}`, {
        method: 'DELETE',
        token
      });
      if (editingNodeId === node._id) resetNodeForm();
      setMessage('Learning topic deleted.');
      await loadNodes();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const updateRoadmapStatus = async (roadmap, status) => {
    setBusy(true);
    setError('');
    try {
      await api(`/admin/roadmaps/${roadmap._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          status
        })
      });
      setMessage(`Roadmap ${status}.`);
      await loadRoadmaps();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const archiveRoadmap = async event => {
    event.preventDefault();
    if (!archiveTarget || archiveConfirmation !== archiveTarget.title) return;
    setBusy(true);
    setArchiveError('');
    try {
      await api(`/admin/roadmaps/${archiveTarget._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          status: 'archived'
        })
      });
      setMessage('Roadmap archived. Existing cycles and records remain preserved.');
      setArchiveTarget(null);
      setArchiveConfirmation('');
      await loadRoadmaps();
    } catch (reason) {
      setArchiveError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const requestArchive = roadmap => {
    setArchiveError('');
    setArchiveConfirmation('');
    setArchiveTarget(roadmap);
  };
  const archiveCycle = async event => {
    event.preventDefault();
    if (!cycleArchiveTarget || cycleArchiveConfirmation !== cycleArchiveTarget.title) return;
    setBusy(true);
    setCycleArchiveError('');
    try {
      await api(`/admin/roadmap-cycles/${cycleArchiveTarget._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          status: 'archived'
        })
      });
      setMessage('Cycle archived. Enrollments, sessions, and attendance records are preserved.');
      setCycleArchiveTarget(null);
      setCycleArchiveConfirmation('');
      await loadRoadmaps();
    } catch (reason) {
      setCycleArchiveError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const requestCycleArchive = cycle => {
    setCycleArchiveError('');
    setCycleArchiveConfirmation('');
    setCycleArchiveTarget(cycle);
  };
  const editCycle = cycle => {
    setEditingCycleId(cycle._id);
    setCycleForm({
      ...cycle,
      objectives: (cycle.objectives || []).join('\n'),
      registrationOpensAt: new Date(new Date(cycle.registrationOpensAt).getTime() - new Date(cycle.registrationOpensAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      registrationClosesAt: new Date(new Date(cycle.registrationClosesAt).getTime() - new Date(cycle.registrationClosesAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      capacity: cycle.capacity ?? ''
    });
    setPreview(null);
    navigate(`/admin/roadmaps/${selectedRoadmap}/cycles/${cycle._id}/edit`);
  };
  const saveCycle = async event => {
    event.preventDefault();
    if (!selectedRoadmap) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = toCyclePayload(cycleForm);
      const path = editingCycleId ? `/admin/roadmap-cycles/${editingCycleId}` : `/admin/roadmaps/${selectedRoadmap}/cycles`;
      await api(path, {
        method: editingCycleId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(body)
      });
      setMessage(editingCycleId ? 'Cycle settings saved. Review the schedule preview before applying any schedule changes.' : 'Cycle created.');
      setEditingCycleId('');
      await loadRoadmaps();
      navigate(`/admin/roadmaps/${selectedRoadmap}/cycles`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const loadPreview = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api(`/admin/roadmap-cycles/${selectedCycle}/schedule/preview`, {
        token
      });
      setPreview(result.preview);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const confirmSchedule = async () => {
    if (!preview || !window.confirm(`Apply this schedule? ${preview.additions} new, ${preview.reschedules} rescheduled, ${preview.cancellations} cancelled, ${preview.preserved} preserved.`)) return;
    setBusy(true);
    setError('');
    try {
      const result = await api(`/admin/roadmap-cycles/${selectedCycle}/schedule`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          confirmationToken: preview.confirmationToken
        })
      });
      setMessage(`Schedule applied: ${result.summary.created} created, ${result.summary.rescheduled} rescheduled, ${result.summary.cancelled} cancelled, ${result.summary.preserved} preserved.`);
      setPreview(null);
      await loadSessions();
      await loadRoadmaps();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const matchesSearch = `${roadmap.title} ${roadmap.audience || ''}`.toLowerCase().includes(roadmapSearch.toLowerCase());
    return matchesSearch && (roadmapStatusFilter === 'all' || roadmap.status === roadmapStatusFilter);
  });
  const eligibleDependencyNodes = useMemo(() => {
    if (!editingNodeId) return {
      options: nodes,
      cycleIds: new Set(),
      missingIds: []
    };
    const childrenByDependency = new Map(nodes.map(node => [String(node._id), []]));
    for (const node of nodes) {
      for (const dependency of node.dependencies || []) {
        childrenByDependency.get(String(dependency))?.push(String(node._id));
      }
    }
    const descendants = new Set([editingNodeId]);
    const pending = [editingNodeId];
    while (pending.length) {
      const current = pending.pop();
      for (const child of childrenByDependency.get(current) || []) {
        if (descendants.has(child)) continue;
        descendants.add(child);
        pending.push(child);
      }
    }
    const options = nodes.filter(node => {
      const id = String(node._id);
      return !descendants.has(id) || nodeForm.dependencies.includes(id);
    });
    const knownIds = new Set(nodes.map(({
      _id
    }) => String(_id)));
    const missingIds = nodeForm.dependencies.filter(id => !knownIds.has(id));
    return {
      options,
      cycleIds: descendants,
      missingIds
    };
  }, [editingNodeId, nodeForm.dependencies, nodes]);
  const pageTitle = routeSection === 'list' ? 'Roadmaps' : routeSection === 'create-roadmap' ? 'Create roadmap' : routeSection === 'cycle-form' ? `${editingCycleId ? 'Edit' : 'Create'} cycle` : routeSection === 'sessions' ? 'Session management' : selected?.title || 'Roadmap';
  return <main className="page-wrap roadmaps-admin-page">
    <div className="roadmap-studio-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/admin/roadmaps">Roadmaps</Link>
      {selected && routeSection !== 'list' && <><span aria-hidden="true">/</span><Link to={`/admin/roadmaps/${selected._id}`}>{selected.title}</Link></>}
      {routeSection === 'settings' && <><span aria-hidden="true">/</span><span>Settings</span></>}
      {routeSection === 'nodes' && <><span aria-hidden="true">/</span><span>Learning path</span></>}
      {routeSection === 'cycles' && <><span aria-hidden="true">/</span><span>Cycles</span></>}
      {routeSection === 'cycle-form' && <><span aria-hidden="true">/</span><Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Cycles</Link><span aria-hidden="true">/</span><span>{editingCycleId ? 'Edit cycle' : 'Create cycle'}</span></>}
      {routeSection === 'sessions' && selectedCycleInfo && <><span aria-hidden="true">/</span><Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Cycles</Link><span aria-hidden="true">/</span><span>{selectedCycleInfo.title}</span><span aria-hidden="true">/</span><span>Sessions</span></>}
      {routeSection === 'overview' && <><span aria-hidden="true">/</span><span>Overview</span></>}
      {routeSection === 'create-roadmap' && <><span aria-hidden="true">/</span><span>Create</span></>}
    </div>
    <div className="page-heading roadmap-studio-heading">
      <div><h1>{pageTitle}</h1>
        <p>{routeSection === 'list' ? 'Manage learning programs and learning paths' : selected ? `${selected.status} roadmap · ${selected.cycles.length} ${selected.cycles.length === 1 ? 'cycle' : 'cycles'}` : 'Create a learning program for the community'}</p>
      </div>
      {routeSection === 'list' && <button className="button button-dark" type="button" onClick={() => {
        setError('');
        setMessage('');
        setRoadmapForm({
          title: '',
          description: '',
          coverImageUrl: '',
          difficulty: 'beginner',
          estimatedDuration: '',
          objectives: '',
          audience: '',
          prerequisites: '',
          status: 'draft'
        });
        navigate('/admin/roadmaps/new');
      }}><Plus size={16} /> Create roadmap</button>}
      {routeSection === 'cycles' && selected?.status !== 'archived' && <button className="button button-dark" type="button" onClick={() => {
        setEditingCycleId('');
        setCycleForm(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
        setError('');
        setMessage('');
        navigate(`/admin/roadmaps/${selectedRoadmap}/cycles/new`);
      }}><Plus size={16} /> Create cycle</button>}
    </div>

    {routeSection === 'list' && <>
      {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={loadRoadmaps}>Try again</button></div>}
      {message && <div className="notice success-notice" role="status">{message}</div>}
      <div className="roadmap-studio-filters">
        <label>Search roadmaps<input type="search" value={roadmapSearch} onChange={event => setRoadmapSearch(event.target.value)} placeholder="Title or audience" /></label>
        <label>Status<select value={roadmapStatusFilter} onChange={event => setRoadmapStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
      </div>
      {loading ? <LoadingState>Loading roadmaps...</LoadingState> : filteredRoadmaps.length ? <div className="roadmap-studio-list">
        {filteredRoadmaps.map(roadmap => <article className="roadmap-studio-row" key={roadmap._id}>
          <div className="roadmap-studio-row-copy"><span className={`roadmap-studio-status status-${roadmap.status}`}>{roadmap.status}</span><h2><Link to={`/admin/roadmaps/${roadmap._id}`}>{roadmap.title}</Link></h2><p>{roadmap.audience || 'Audience not specified'} · {roadmap.cycles.length} {roadmap.cycles.length === 1 ? 'cycle' : 'cycles'}</p></div>
          <div className="roadmap-studio-row-actions">
            <Link className="button button-outline" to={`/admin/roadmaps/${roadmap._id}`}>Manage roadmap <ArrowRight size={15} /></Link>
            {roadmap.status === 'draft' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'published')}>Publish</button>}
            {roadmap.status === 'published' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'completed')}>Mark completed</button>}
            {roadmap.status !== 'archived' && <button type="button" className="button button-outline roadmap-archive-button" disabled={busy} onClick={() => requestArchive(roadmap)}>Archive</button>}
          </div>
        </article>)}
      </div> : <div className="empty-state"><h2>{roadmaps.length ? 'No roadmaps match these filters.' : 'No roadmaps yet.'}</h2><p>Create a roadmap to start organizing cycles and sessions.</p>{!roadmaps.length && <button className="button button-dark" type="button" onClick={() => navigate('/admin/roadmaps/new')}><Plus size={16} /> Create roadmap</button>}</div>}
    </>}

    {routeSection === 'create-roadmap' && <section className="roadmap-admin-panel">
      <form className="roadmap-admin-form" onSubmit={saveRoadmap}>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        <label>Title<input maxLength="140" required value={roadmapForm.title} onChange={event => setRoadmapForm({
            ...roadmapForm,
            title: event.target.value
          })} /></label>
        <label>Description<textarea rows="3" maxLength="5000" required value={roadmapForm.description} onChange={event => setRoadmapForm({
            ...roadmapForm,
            description: event.target.value
          })} /></label>
        <label>Cover image URL (optional)<input type="url" maxLength="500" value={roadmapForm.coverImageUrl} onChange={event => setRoadmapForm({
            ...roadmapForm,
            coverImageUrl: event.target.value
          })} /></label>
        <label>Difficulty<select value={roadmapForm.difficulty} onChange={event => setRoadmapForm({
            ...roadmapForm,
            difficulty: event.target.value
          })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
        <label>Estimated duration (optional)<input maxLength="80" placeholder="e.g. 8 weeks" value={roadmapForm.estimatedDuration} onChange={event => setRoadmapForm({
            ...roadmapForm,
            estimatedDuration: event.target.value
          })} /></label>
        <label>Learning objectives <small>One per line</small><textarea rows="3" value={roadmapForm.objectives} onChange={event => setRoadmapForm({
            ...roadmapForm,
            objectives: event.target.value
          })} /></label>
        <label>Expected audience<input value={roadmapForm.audience} onChange={event => setRoadmapForm({
            ...roadmapForm,
            audience: event.target.value
          })} /></label>
        <label>Prerequisites<input value={roadmapForm.prerequisites} onChange={event => setRoadmapForm({
            ...roadmapForm,
            prerequisites: event.target.value
          })} /></label>
        <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Plus size={15} /> Create draft roadmap</button><button className="button button-outline" type="button" onClick={() => navigate('/admin/roadmaps')}>Cancel</button></div>
      </form>
    </section>}
    {routeSection !== 'list' && routeSection !== 'create-roadmap' && !selected && loading && <LoadingState>Loading roadmap details...</LoadingState>}
    {routeSection !== 'list' && routeSection !== 'create-roadmap' && !selected && !loading && error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={loadRoadmaps}>Try again</button></div>}
    {routeSection !== 'list' && routeSection !== 'create-roadmap' && routeRoadmapId && !selected && !loading && !error && <div className="notice error-notice" role="alert">Roadmap not found. <Link to="/admin/roadmaps">Return to roadmaps</Link></div>}

    {selected && routeSection !== 'list' && routeSection !== 'create-roadmap' && <>
      <nav className="roadmap-studio-tabs" aria-label={`${selected.title} sections`}>
        <Link aria-current={routeSection === 'overview' ? 'page' : undefined} className={routeSection === 'overview' ? 'active' : ''} to={`/admin/roadmaps/${selected._id}`}>Overview</Link>
        <Link aria-current={routeSection === 'nodes' ? 'page' : undefined} className={routeSection === 'nodes' ? 'active' : ''} to={`/admin/roadmaps/${selected._id}/nodes`}>Learning path</Link>
        <Link aria-current={routeSection === 'cycles' || routeSection === 'cycle-form' || routeSection === 'sessions' ? 'page' : undefined} className={routeSection === 'cycles' || routeSection === 'cycle-form' || routeSection === 'sessions' ? 'active' : ''} to={`/admin/roadmaps/${selected._id}/cycles`}>Cycles <span>{selected.cycles.length}</span></Link>
        <Link aria-current={routeSection === 'settings' ? 'page' : undefined} className={routeSection === 'settings' ? 'active' : ''} to={`/admin/roadmaps/${selected._id}/settings`}>Settings</Link>
      </nav>
      {error && routeSection !== 'sessions' && <div className="notice error-notice" role="alert">{error}</div>}
      {message && routeSection !== 'sessions' && <div className="notice success-notice" role="status">{message}</div>}

      {routeSection === 'overview' && <section className="roadmap-admin-panel roadmap-studio-overview">
        <div className="roadmap-studio-overview-heading"><div><span className={`roadmap-studio-status status-${selected.status}`}>{selected.status}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><Link className="button button-dark" to="/admin/cycles">Manage cycles <ArrowRight size={15} /></Link></div>
        <div className="roadmap-studio-facts"><div><strong>{selected.cycles.length}</strong><span>Cycles</span></div><div><strong>{selected.audience || '—'}</strong><span>Expected audience</span></div><div><strong>{selected.objectives?.length || 0}</strong><span>Learning objectives</span></div></div>
        {selected.prerequisites && <p><strong>Prerequisites:</strong> {selected.prerequisites}</p>}
        <div className="roadmap-admin-actions">
          {selected.status === 'draft' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(selected, 'published')}>Publish roadmap</button>}
          {selected.status === 'published' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(selected, 'completed')}>Mark completed</button>}
          {selected.status !== 'archived' && <button type="button" className="button button-outline roadmap-archive-button" disabled={busy} onClick={() => requestArchive(selected)}>Archive roadmap</button>}
        </div>
      </section>}

      {routeSection === 'settings' && selected.status !== 'archived' && selectedRoadmapForm && <section className="roadmap-admin-panel">
        <h2>Roadmap settings</h2>
        <form className="roadmap-admin-form" onSubmit={saveSelectedRoadmap}>
          <label>Title<input maxLength="140" required value={selectedRoadmapForm.title} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              title: event.target.value
            })} /></label>
          <label>Description<textarea rows="3" maxLength="5000" required value={selectedRoadmapForm.description} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              description: event.target.value
            })} /></label>
          <label>Cover image URL (optional)<input type="url" maxLength="500" value={selectedRoadmapForm.coverImageUrl} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              coverImageUrl: event.target.value
            })} /></label>
          <label>Difficulty<select value={selectedRoadmapForm.difficulty} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              difficulty: event.target.value
            })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>Estimated duration (optional)<input maxLength="80" placeholder="e.g. 8 weeks" value={selectedRoadmapForm.estimatedDuration} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              estimatedDuration: event.target.value
            })} /></label>
          <label>Learning objectives <small>One per line</small><textarea rows="3" value={selectedRoadmapForm.objectives} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              objectives: event.target.value
            })} /></label>
          <label>Expected audience<input value={selectedRoadmapForm.audience} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              audience: event.target.value
            })} /></label>
          <label>Prerequisites<input value={selectedRoadmapForm.prerequisites} onChange={event => setSelectedRoadmapForm({
              ...selectedRoadmapForm,
              prerequisites: event.target.value
            })} /></label>
          <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> Save changes</button></div>
        </form>
      </section>}
      {routeSection === 'settings' && selected.status === 'archived' && <div className="notice">Archived roadmaps are read-only.</div>}
      {routeSection === 'cycle-form' && selected.status === 'archived' && <div className="notice">Archived roadmaps cannot be changed.</div>}
      {routeSection === 'nodes' && <section className="roadmap-admin-panel learning-path-admin">
        <div className="roadmap-studio-section-heading"><div><h2>Learning path topics</h2><p>Create topics, link prerequisites, and add learning resources or practice problems.</p></div></div>
        {selected.status === 'archived' ? <div className="notice">Archived roadmaps are read-only.</div> : <>
          {error && <div className="notice error-notice" role="alert">{error}</div>}
          {message && <div className="notice success-notice" role="status">{message}</div>}
          <form className="roadmap-admin-form" onSubmit={saveNode}>
            <h3>{editingNodeId ? 'Edit topic' : 'Add topic'}</h3>
            <label>Topic title<input required maxLength="140" value={nodeForm.title} onChange={event => setNodeForm({
                ...nodeForm,
                title: event.target.value
              })} /></label>
            <label>Description<textarea rows="3" maxLength="3000" value={nodeForm.description} onChange={event => setNodeForm({
                ...nodeForm,
                description: event.target.value
              })} /></label>
            <div className="roadmap-node-dependencies">
              <div className="roadmap-node-dependencies-heading"><strong>Prerequisites</strong><small>Click topic names to select one or more. Leave all unselected for a root topic.</small></div>
              <div className="roadmap-node-dependency-options" role="group" aria-label="Select prerequisite topics">
                {eligibleDependencyNodes.options.map(node => {
                  const id = String(node._id);
                  const selected = nodeForm.dependencies.includes(id);
                  const invalidExistingLink = selected && eligibleDependencyNodes.cycleIds.has(id);
                  return <button className={`roadmap-node-dependency-option${selected ? ' selected' : ''}${invalidExistingLink ? ' invalid' : ''}`} key={id} type="button" aria-pressed={selected} onClick={() => setNodeForm(current => {
                    const currentlySelected = current.dependencies.includes(id);
                    return {
                      ...current,
                      dependencies: currentlySelected ? current.dependencies.filter(dependency => dependency !== id) : [...current.dependencies, id]
                    };
                  })}>
                    <span>{node.title}{invalidExistingLink && <small>Existing link creates a circular path · click to remove</small>}</span>
                    {selected && <Check size={16} aria-hidden="true" />}
                  </button>;
                })}
                {eligibleDependencyNodes.missingIds.map(id => <button className="roadmap-node-dependency-option selected invalid" key={id} type="button" aria-pressed="true" onClick={() => setNodeForm(current => ({
                  ...current,
                  dependencies: current.dependencies.filter(dependency => dependency !== id)
                }))}>
                  <span>Unavailable topic<small>Click to remove this prerequisite</small></span><Check size={16} aria-hidden="true" />
                </button>)}
                {!eligibleDependencyNodes.options.length && !eligibleDependencyNodes.missingIds.length && <p className="roadmap-node-dependency-empty">Add another topic first to choose a prerequisite.</p>}
              </div>
            </div>
            <div className="roadmap-node-form-row">
              <label>Order<input type="number" min="0" step="1" required value={nodeForm.position} onChange={event => setNodeForm({
                  ...nodeForm,
                  position: event.target.value
                })} /></label>
              <label>Estimated hours<input type="number" min="0" step="0.5" value={nodeForm.estimatedHours} onChange={event => setNodeForm({
                  ...nodeForm,
                  estimatedHours: event.target.value
                })} /></label>
              <label className="roadmap-node-required"><input type="checkbox" checked={nodeForm.isRequired} onChange={event => setNodeForm({
                  ...nodeForm,
                  isRequired: event.target.checked
                })} /> Required topic</label>
            </div>
            <label>Learning resources <small>One URL per line, or title | https://example.com</small><textarea rows="3" value={nodeForm.resources} onChange={event => setNodeForm({
                ...nodeForm,
                resources: event.target.value
              })} /></label>
            <label>Programming problems <small>One per line: title | Easy, Medium, or Hard | https://example.com. Older title | URL and URL-only lines default to Medium.</small><textarea rows="5" value={nodeForm.problems} onChange={event => setNodeForm({
                ...nodeForm,
                problems: event.target.value
              })} /></label>
            <div className="roadmap-admin-actions"><button className="button button-dark" disabled={nodeSaving}><Save size={15} /> {nodeSaving ? 'Saving topic...' : editingNodeId ? 'Save topic' : 'Add topic'}</button>{editingNodeId && <button className="button button-outline" type="button" disabled={nodeSaving} onClick={resetNodeForm}>Cancel edit</button>}</div>
          </form>
          <div className="learning-path-admin-preview">
            <h3>Path preview</h3>
            {nodes.length > 0 && <LearningPath nodes={nodes} />}
            {nodesLoading ? <LoadingState>Loading topics...</LoadingState> : nodes.length ? nodes.map(node => <article className="learning-path-admin-node" key={node._id}>
              <div><span className="category-label">{node.isRequired ? 'Required' : 'Optional'} · Order {node.position}</span><h4>{node.title}</h4>
                {(node.dependencies || []).length > 0 && <p>Prerequisites: {node.dependencies.map(id => nodes.find(item => item._id === String(id))?.title).filter(Boolean).join(', ') || 'None'}</p>}
              </div><div className="roadmap-admin-actions"><button className="button button-outline" type="button" onClick={() => editNode(node)}>Edit</button><button className="button button-outline roadmap-archive-button" type="button" disabled={busy} onClick={() => removeNode(node)}>Delete</button></div>
            </article>) : <div className="empty-state"><p>Add topics to preview the learning path here.</p></div>}
          </div>
        </>}
      </section>}

      {routeSection === 'cycles' && <section className="roadmap-admin-panel">
        <div className="roadmap-studio-section-heading"><div><h2>Cycles</h2></div></div>
        {selected.cycles?.length ? <div className="roadmap-studio-cycle-list">{selected.cycles.map(cycle => <article className="roadmap-studio-cycle-row" key={cycle._id}>
          <div className="roadmap-studio-cycle-order">{cycle.order}</div>
          <div className="roadmap-studio-cycle-copy"><span className={`roadmap-studio-status status-${cycle.status}`}>{cycle.difficulty} · {cycle.status}</span><h3>{cycle.title}</h3><p>{cycle.startDate} – {cycle.endDate} · {cycle.sessionsPerWeek} sessions / week · {cycle.enrollmentCount}{cycle.capacity ? `/${cycle.capacity}` : ''} enrolled</p></div>
          <div className="roadmap-admin-actions">{cycle.status !== 'archived' && <><button type="button" className="button button-outline" onClick={() => editCycle(cycle)}>Edit cycle</button><button type="button" className="button button-outline roadmap-archive-button" disabled={busy} onClick={() => requestCycleArchive(cycle)}>Archive cycle</button></>}<Link className="button button-dark" to={`/admin/roadmaps/${selected._id}/cycles/${cycle._id}/sessions`}>Manage sessions</Link></div>
        </article>)}</div> : <div className="empty-state"><h3>No cycles yet.</h3><p>Create a cycle to define its schedule and student registration window.</p></div>}
      </section>}

      {routeSection === 'cycle-form' && routeCycleId && !selected.cycles.some(cycle => cycle._id === routeCycleId) && <div className="notice error-notice" role="alert">Cycle not found. <Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Return to cycles</Link></div>}
      {routeSection === 'cycle-form' && selected.status !== 'archived' && (!routeCycleId || editingCycleId === routeCycleId) && <section className="roadmap-admin-panel">
        <h2>{editingCycleId ? 'Edit cycle settings' : 'Create cycle'}</h2>
        <form className="roadmap-admin-form roadmap-cycle-form" onSubmit={saveCycle}>
          <fieldset className="roadmap-form-group"><legend>Basic information</legend>
            <label>Order<input type="number" min="1" required value={cycleForm.order} onChange={event => setCycleForm({
                ...cycleForm,
                order: event.target.value
              })} /></label>
            <label>Cycle title<input maxLength="120" required value={cycleForm.title} onChange={event => setCycleForm({
                ...cycleForm,
                title: event.target.value
              })} /></label>
            <label>Description<textarea rows="3" required value={cycleForm.description} onChange={event => setCycleForm({
                ...cycleForm,
                description: event.target.value
              })} /></label>
            <label>Location (optional)<input maxLength="200" value={cycleForm.location || ''} onChange={event => setCycleForm({
                ...cycleForm,
                location: event.target.value
              })} placeholder="Campus, room, or online venue" /></label>
            <label>Difficulty<select value={cycleForm.difficulty} onChange={event => setCycleForm({
                ...cycleForm,
                difficulty: event.target.value
              })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label>Objectives <small>One per line</small><textarea rows="3" value={cycleForm.objectives} onChange={event => setCycleForm({
                ...cycleForm,
                objectives: event.target.value
              })} /></label>
            <label>Prerequisites<input value={cycleForm.prerequisites} onChange={event => setCycleForm({
                ...cycleForm,
                prerequisites: event.target.value
              })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Schedule configuration</legend>
            <label>Cycle start date<input type="date" required value={cycleForm.startDate} onChange={event => setCycleForm({
                ...cycleForm,
                startDate: event.target.value
              })} /></label>
            <label>Cycle end date<input type="date" required value={cycleForm.endDate} onChange={event => setCycleForm({
                ...cycleForm,
                endDate: event.target.value
              })} /></label>
            <label>Sessions per week<input type="number" min="1" max="7" required value={cycleForm.sessionsPerWeek} onChange={event => setCycleForm({
                ...cycleForm,
                sessionsPerWeek: event.target.value
              })} /></label>
            <fieldset className="roadmap-weekdays"><legend>Training days (must match weekly frequency)</legend>{weekdays.map(([day, value]) => <label key={day}><input type="checkbox" checked={cycleForm.trainingDays.includes(value)} onChange={event => setCycleForm({
                  ...cycleForm,
                  trainingDays: event.target.checked ? [...cycleForm.trainingDays, value] : cycleForm.trainingDays.filter(item => item !== value)
                })} /> {day}</label>)}</fieldset>
            <label>Local start time<input type="time" required value={cycleForm.startTime} onChange={event => setCycleForm({
                ...cycleForm,
                startTime: event.target.value
              })} /></label>
            <label>Duration (minutes)<input type="number" min="15" max="600" required value={cycleForm.sessionDurationMinutes} onChange={event => setCycleForm({
                ...cycleForm,
                sessionDurationMinutes: event.target.value
              })} /></label>
            <label>Time zone (IANA)<input required maxLength="80" placeholder="Africa/Cairo" value={cycleForm.timeZone} onChange={event => setCycleForm({
                ...cycleForm,
                timeZone: event.target.value
              })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Registration</legend>
            <label>Registration opens<input type="datetime-local" required value={cycleForm.registrationOpensAt} onChange={event => setCycleForm({
                ...cycleForm,
                registrationOpensAt: event.target.value
              })} /></label>
            <label>Registration closes<input type="datetime-local" required value={cycleForm.registrationClosesAt} onChange={event => setCycleForm({
                ...cycleForm,
                registrationClosesAt: event.target.value
              })} /></label>
            <label>Capacity (optional)<input type="number" min="1" value={cycleForm.capacity} onChange={event => setCycleForm({
                ...cycleForm,
                capacity: event.target.value
              })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Points and status</legend>
            <label>Points per attended session<input type="number" min="0" step="any" value={cycleForm.attendancePoints} onChange={event => setCycleForm({
                ...cycleForm,
                attendancePoints: event.target.value
              })} /></label>
            <label>Cycle status<select value={cycleForm.status} onChange={event => setCycleForm({
                ...cycleForm,
                status: event.target.value
              })}><option value="draft">Draft</option><option value="published" disabled={selected.status !== 'published'}>Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
          </fieldset>
          <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> {editingCycleId ? 'Save cycle' : 'Create cycle'}</button><button type="button" className="button button-outline" onClick={() => navigate(`/admin/roadmaps/${selectedRoadmap}/cycles`)}>Cancel</button></div>
        </form>
      </section>}

      {routeSection === 'sessions' && selectedCycleInfo && <section className="roadmap-admin-panel roadmap-studio-sessions">
        <div className="roadmap-studio-section-heading"><div><h2>{selectedCycleInfo.title}</h2><p>{selectedCycleInfo.status} · Cycle {selectedCycleInfo.order}</p></div><Link className="button button-outline" to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Back to cycles</Link></div>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {message && <div className="notice success-notice" role="status">{message}</div>}
        <div className="roadmap-studio-schedule-summary">
          <p><strong>Cycle dates</strong><span>{selectedCycleInfo.startDate} – {selectedCycleInfo.endDate}</span></p>
          <p><strong>Weekly schedule</strong><span>{selectedCycleInfo.sessionsPerWeek} sessions · {(selectedCycleInfo.trainingDays || []).map(day => weekdays.find(item => item[1] === day)?.[0]).filter(Boolean).join(', ')}</span></p>
          <p><strong>Local session time</strong><span>{selectedCycleInfo.startTime} · {selectedCycleInfo.timeZone}</span></p>
          {selectedCycleInfo.location && <p><strong>Location</strong><span>{selectedCycleInfo.location}</span></p>}
          <p><strong>Enrollment</strong><span>{enrolledStudents.length} students{selectedCycleInfo.capacity ? ` · capacity ${selectedCycleInfo.capacity}` : ''}</span></p>
        </div>
        <section className="roadmap-studio-schedule">
          <div className="roadmap-studio-section-heading"><div><h3>Schedule generation</h3><p>Preview changes first; applying is a separate confirmed action.</p></div><div className="roadmap-admin-actions"><button type="button" className="button button-outline" disabled={busy} onClick={loadPreview}>{busy ? 'Working...' : 'Preview schedule'}</button>{preview && <button type="button" className="button button-dark" disabled={busy} onClick={confirmSchedule}>Apply schedule</button>}</div></div>
          {preview && <div className="roadmap-schedule-preview"><p>{preview.proposedCount} proposed sessions · {preview.additions} new · {preview.reschedules} rescheduled · {preview.cancellations} cancelled · {preview.preserved} preserved</p><div className="roadmap-preview-list">{preview.changes.map(change => <span key={`${change.ordinal}-${change.action}`}>{change.action}: Session {change.ordinal} · {change.startsAt ? formatSessionTime({
                  startsAt: change.startsAt,
                  timeZone: selectedCycleInfo.timeZone
                }) : '—'}</span>)}</div></div>}
        </section>
        <section className="roadmap-studio-students"><h3>Enrolled students <span>{enrolledStudents.length}</span></h3>{enrolledStudents.length ? <div className="roadmap-studio-student-list">{enrolledStudents.map(({
              _id,
              student
            }) => student && <span key={_id}>{student.name} · {student.username || student.email}</span>)}</div> : <p>No students enrolled in this cycle yet.</p>}</section>
        <section className="roadmap-studio-session-section"><h3>Sessions <span>{sessions.length}</span></h3>
          {sessionsLoading ? <LoadingState>Loading sessions...</LoadingState> : sessions.length ? <div className="roadmap-admin-session-list">{sessions.map(session => <AdminSession key={session._id} token={token} session={session} students={enrolledStudents} refresh={loadSessions} />)}</div> : <p>No sessions have been generated for this cycle yet. Preview and apply the schedule to create sessions.</p>}
        </section>
      </section>}
      {routeSection === 'sessions' && !selectedCycleInfo && <div className="notice error-notice" role="alert">Cycle not found in this roadmap. <Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Return to cycles</Link></div>}
      {loading && <LoadingState>Loading roadmap administration...</LoadingState>}
    </>}
    {archiveTarget && <div className="roadmap-archive-overlay" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) setArchiveTarget(null);
    }}>
      <form className="roadmap-archive-dialog" role="dialog" aria-modal="true" aria-labelledby="roadmap-archive-title" onSubmit={archiveRoadmap}>
        <button className="roadmap-archive-close" type="button" aria-label="Cancel archive" disabled={busy} onClick={() => setArchiveTarget(null)}><X size={20} /></button>
        <span className="eyebrow">CONFIRM ROADMAP ARCHIVE</span>
        <h2 id="roadmap-archive-title">Archive this roadmap?</h2>
        <p>Archiving <strong>{archiveTarget.title}</strong> hides it from active learning paths. Its cycles and existing records are preserved.</p>
        <label htmlFor="roadmap-archive-confirmation">Type the roadmap name to continue</label>
        <input id="roadmap-archive-confirmation" autoComplete="off" value={archiveConfirmation} onChange={event => setArchiveConfirmation(event.target.value)} placeholder={archiveTarget.title} required />
        {archiveError && <div className="notice error-notice" role="alert">{archiveError}</div>}
        <div className="roadmap-archive-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={() => setArchiveTarget(null)}>Cancel</button>
          <button type="submit" className="button roadmap-archive-confirm" disabled={busy || archiveConfirmation !== archiveTarget.title}>{busy ? 'Archiving...' : 'Archive roadmap'}</button>
        </div>
      </form>
    </div>}
    {cycleArchiveTarget && <div className="roadmap-archive-overlay" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) setCycleArchiveTarget(null);
    }}>
      <form className="roadmap-archive-dialog" role="dialog" aria-modal="true" aria-labelledby="cycle-archive-title" onSubmit={archiveCycle}>
        <button className="roadmap-archive-close" type="button" aria-label="Cancel cycle archive" disabled={busy} onClick={() => setCycleArchiveTarget(null)}><X size={20} /></button>
        <span className="eyebrow">CONFIRM CYCLE ARCHIVE</span>
        <h2 id="cycle-archive-title">Archive this cycle?</h2>
        <p>Archiving <strong>{cycleArchiveTarget.title}</strong> closes it to new registrations and removes it from cycle listings. Existing enrollments, sessions, and attendance remain preserved.</p>
        <label htmlFor="cycle-archive-confirmation">Type the cycle name to continue</label>
        <input id="cycle-archive-confirmation" autoComplete="off" value={cycleArchiveConfirmation} onChange={event => setCycleArchiveConfirmation(event.target.value)} placeholder={cycleArchiveTarget.title} required />
        {cycleArchiveError && <div className="notice error-notice" role="alert">{cycleArchiveError}</div>}
        <div className="roadmap-archive-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={() => setCycleArchiveTarget(null)}>Cancel</button>
          <button type="submit" className="button roadmap-archive-confirm" disabled={busy || cycleArchiveConfirmation !== cycleArchiveTarget.title}>{busy ? 'Archiving...' : 'Archive cycle'}</button>
        </div>
      </form>
    </div>}
  </main>;
}
