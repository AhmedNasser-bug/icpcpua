import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Download, Plus, QrCode, Save, Upload, X } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { LearningPath } from '../components/LearningPath.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { weekdays, formatSessionTime, formatDateTimeInput, dateTimeInputToIso, formatProblems, parseProblems, emptyCycleForm, toCyclePayload, formatResources, parseResources } from '../utils/roadmapUtils.js';
import './AdminRoadmapsPage.css';

const ROADMAP_EXPORT_SCHEMA_VERSION = 1;
const ROADMAP_EXPORT_LIMIT = 5 * 1024 * 1024;

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
}

function rejectUnknownFields(value, allowedFields, label) {
  const unexpected = Object.keys(value).find(field => !allowedFields.includes(field));
  if (unexpected) throw new Error(`${label} contains an unsupported field: "${unexpected}".`);
}

function validateImportText(value, label, maxLength, { required = false } = {}) {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return normalized;
}

function validateImportUrl(value, label) {
  const normalized = validateImportText(value, label, 500, { required: true });
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
  return url.toString();
}

function validateRoadmapImport(input) {
  assertPlainObject(input, 'Import file');
  rejectUnknownFields(input, ['schemaVersion', 'exportedAt', 'roadmap', 'nodes'], 'Import file');
  if (input.schemaVersion !== ROADMAP_EXPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported roadmap schema version "${input.schemaVersion ?? 'missing'}". This page supports version ${ROADMAP_EXPORT_SCHEMA_VERSION}.`);
  }
  if (input.exportedAt !== undefined && (typeof input.exportedAt !== 'string' || Number.isNaN(Date.parse(input.exportedAt)))) {
    throw new Error('exportedAt must be a valid date string.');
  }

  assertPlainObject(input.roadmap, 'roadmap');
  rejectUnknownFields(input.roadmap, ['title', 'description', 'coverImageUrl', 'difficulty', 'estimatedDuration', 'objectives', 'audience', 'prerequisites', 'status'], 'roadmap');
  const roadmap = {
    title: validateImportText(input.roadmap.title, 'Roadmap title', 140, { required: true }),
    description: validateImportText(input.roadmap.description, 'Roadmap description', 5000, { required: true }),
    coverImageUrl: input.roadmap.coverImageUrl === undefined || input.roadmap.coverImageUrl === '' ? '' : validateImportUrl(input.roadmap.coverImageUrl, 'Cover image URL'),
    difficulty: input.roadmap.difficulty ?? 'beginner',
    estimatedDuration: validateImportText(input.roadmap.estimatedDuration ?? '', 'Estimated duration', 80),
    objectives: input.roadmap.objectives ?? [],
    audience: validateImportText(input.roadmap.audience ?? '', 'Audience', 500),
    prerequisites: validateImportText(input.roadmap.prerequisites ?? '', 'Prerequisites', 1000),
    status: 'draft'
  };
  if (!['beginner', 'intermediate', 'advanced'].includes(roadmap.difficulty)) {
    throw new Error('Roadmap difficulty must be beginner, intermediate, or advanced.');
  }
  if (!Array.isArray(roadmap.objectives) || roadmap.objectives.length > 30) {
    throw new Error('Roadmap objectives must contain up to 30 items.');
  }
  roadmap.objectives = roadmap.objectives.map((objective, index) => validateImportText(objective, `Objective ${index + 1}`, 160)).filter(Boolean);
  if (input.roadmap.status !== undefined && !['draft', 'published', 'completed', 'archived'].includes(input.roadmap.status)) {
    throw new Error('Roadmap status is not supported.');
  }

  if (!Array.isArray(input.nodes) || input.nodes.length > 500) {
    throw new Error('nodes must be an array containing up to 500 learning topics.');
  }
  const seenIds = new Set();
  const nodes = input.nodes.map((item, index) => {
    assertPlainObject(item, `Topic ${index + 1}`);
    rejectUnknownFields(item, ['id', 'title', 'description', 'dependencies', 'position', 'estimatedHours', 'resources', 'problems', 'isRequired'], `Topic ${index + 1}`);
    const id = validateImportText(item.id, `Topic ${index + 1} identifier`, 140, { required: true });
    if (seenIds.has(id)) throw new Error(`Topic identifier "${id}" is duplicated.`);
    seenIds.add(id);

    const dependencies = item.dependencies ?? [];
    if (!Array.isArray(dependencies) || dependencies.length > 100 || dependencies.some(dependency => typeof dependency !== 'string' || !dependency.trim())) {
      throw new Error(`Topic "${item.title || id}" has invalid prerequisites.`);
    }
    const normalizedDependencies = dependencies.map(dependency => dependency.trim());
    if (new Set(normalizedDependencies).size !== normalizedDependencies.length) {
      throw new Error(`Topic "${item.title || id}" contains a duplicate prerequisite.`);
    }
    if (!Number.isInteger(item.position ?? index) || (item.position ?? index) < 0) {
      throw new Error(`Topic "${item.title || id}" order must be a non-negative whole number.`);
    }
    const estimatedHours = item.estimatedHours === '' ? null : item.estimatedHours ?? null;
    if (estimatedHours !== null && (!Number.isFinite(Number(estimatedHours)) || Number(estimatedHours) < 0)) {
      throw new Error(`Topic "${item.title || id}" estimated hours must be a non-negative number or null.`);
    }
    if (item.isRequired !== undefined && typeof item.isRequired !== 'boolean') {
      throw new Error(`Topic "${item.title || id}" isRequired must be true or false.`);
    }

    const resources = item.resources ?? [];
    if (!Array.isArray(resources) || resources.length > 30) {
      throw new Error(`Topic "${item.title || id}" must contain up to 30 resources.`);
    }
    const validatedResources = resources.map((resource, resourceIndex) => {
      assertPlainObject(resource, `Topic "${item.title || id}" resource ${resourceIndex + 1}`);
      rejectUnknownFields(resource, ['title', 'url'], `Topic "${item.title || id}" resource ${resourceIndex + 1}`);
      return {
        title: validateImportText(resource.title, 'Resource title', 140, { required: true }),
        url: validateImportUrl(resource.url, 'Resource URL')
      };
    });

    const problems = item.problems ?? [];
    if (!Array.isArray(problems) || problems.length > 100) {
      throw new Error(`Topic "${item.title || id}" must contain up to 100 problems.`);
    }
    const validatedProblems = problems.map((problem, problemIndex) => {
      assertPlainObject(problem, `Topic "${item.title || id}" problem ${problemIndex + 1}`);
      rejectUnknownFields(problem, ['title', 'url', 'difficulty'], `Topic "${item.title || id}" problem ${problemIndex + 1}`);
      const difficulty = problem.difficulty ?? 'medium';
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new Error(`Topic "${item.title || id}" problem ${problemIndex + 1} has an unsupported difficulty.`);
      }
      return {
        title: validateImportText(problem.title, 'Problem title', 140, { required: true }),
        url: validateImportUrl(problem.url, 'Problem URL'),
        difficulty
      };
    });

    return {
      id,
      title: validateImportText(item.title, `Topic ${index + 1} title`, 140, { required: true }),
      description: validateImportText(item.description ?? '', `Topic ${index + 1} description`, 3000),
      dependencies: normalizedDependencies,
      position: item.position ?? index,
      estimatedHours,
      resources: validatedResources,
      problems: validatedProblems,
      isRequired: item.isRequired ?? true,
      sourceIndex: index
    };
  });

  const nodesById = new Map(nodes.map(node => [node.id, node]));
  const childrenById = new Map(nodes.map(node => [node.id, []]));
  const dependencyCount = new Map();
  for (const node of nodes) {
    for (const dependency of node.dependencies) {
      if (!nodesById.has(dependency)) throw new Error(`Topic "${node.title}" references a missing prerequisite.`);
      if (dependency === node.id) throw new Error(`Topic "${node.title}" cannot depend on itself.`);
      childrenById.get(dependency).push(node.id);
    }
    dependencyCount.set(node.id, node.dependencies.length);
  }
  const compareNodes = (leftId, rightId) => {
    const left = nodesById.get(leftId);
    const right = nodesById.get(rightId);
    return left.position - right.position || left.sourceIndex - right.sourceIndex;
  };
  const ready = nodes.filter(node => dependencyCount.get(node.id) === 0).map(node => node.id).sort(compareNodes);
  const orderedNodes = [];
  while (ready.length) {
    const id = ready.shift();
    orderedNodes.push(nodesById.get(id));
    for (const childId of childrenById.get(id)) {
      dependencyCount.set(childId, dependencyCount.get(childId) - 1);
      if (dependencyCount.get(childId) === 0) {
        ready.push(childId);
        ready.sort(compareNodes);
      }
    }
  }
  if (orderedNodes.length !== nodes.length) throw new Error('The prerequisite relationships contain a circular path.');

  return { roadmap, nodes, orderedNodes };
}

function validateRoadmapForPublish(roadmap, nodes) {
  if (!roadmap.title?.trim() || !roadmap.description?.trim()) {
    throw new Error('Add a roadmap title and description before publishing.');
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(roadmap.difficulty)) {
    throw new Error('Choose a supported roadmap difficulty before publishing.');
  }
  if (roadmap.coverImageUrl) validateImportUrl(roadmap.coverImageUrl, 'Cover image URL');
  if (!Array.isArray(roadmap.objectives) || roadmap.objectives.length > 30) {
    throw new Error('Roadmap objectives must contain up to 30 items.');
  }
  roadmap.objectives.forEach((objective, index) => validateImportText(objective, `Objective ${index + 1}`, 160));
  if (!nodes.length) throw new Error('Add at least one learning topic before publishing.');
  const nodeIds = nodes.map(node => String(node._id));
  if (nodeIds.some(id => !/^[a-f\d]{24}$/i.test(id)) || new Set(nodeIds).size !== nodeIds.length) {
    throw new Error('Learning topics must have unique, valid server identifiers.');
  }
  const knownIds = new Set(nodeIds);
  const childrenById = new Map(nodes.map(node => [String(node._id), []]));
  const pending = new Map();
  for (const node of nodes) {
    const dependencies = (node.dependencies || []).map(String);
    if (dependencies.length > 100 || new Set(dependencies).size !== dependencies.length || dependencies.some(id => !knownIds.has(id) || id === String(node._id))) {
      throw new Error(`Fix missing or self-referencing prerequisites on "${node.title}".`);
    }
    for (const dependency of dependencies) childrenById.get(dependency).push(String(node._id));
    pending.set(String(node._id), dependencies.length);
    if (!node.title?.trim()) throw new Error('Every learning topic needs a title.');
    validateImportText(node.title, `Topic "${node.title}" title`, 140, { required: true });
    validateImportText(node.description || '', `Topic "${node.title}" description`, 3000);
    if (!Number.isInteger(node.position) || node.position < 0) throw new Error(`Topic "${node.title}" has an invalid order.`);
    if (node.estimatedHours !== null && node.estimatedHours !== undefined && (!Number.isFinite(Number(node.estimatedHours)) || Number(node.estimatedHours) < 0)) {
      throw new Error(`Topic "${node.title}" has invalid estimated hours.`);
    }
    if (!Array.isArray(node.resources) || node.resources.length > 30 || !Array.isArray(node.problems) || node.problems.length > 100) {
      throw new Error(`Topic "${node.title}" has too many or invalid learning links.`);
    }
    node.resources.forEach((resource, index) => {
      validateImportText(resource.title, `Topic "${node.title}" resource ${index + 1} title`, 140, { required: true });
      validateImportUrl(resource.url, `Topic "${node.title}" resource ${index + 1} URL`);
    });
    node.problems.forEach((problem, index) => {
      validateImportText(problem.title, `Topic "${node.title}" problem ${index + 1} title`, 140, { required: true });
      validateImportUrl(problem.url, `Topic "${node.title}" problem ${index + 1} URL`);
      if (!['easy', 'medium', 'hard'].includes(problem.difficulty || 'medium')) {
        throw new Error(`Topic "${node.title}" problem ${index + 1} has an unsupported difficulty.`);
      }
    });
  }
  const ready = [...pending].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  while (ready.length) {
    const id = ready.pop();
    visited += 1;
    for (const childId of childrenById.get(id)) {
      pending.set(childId, pending.get(childId) - 1);
      if (pending.get(childId) === 0) ready.push(childId);
    }
  }
  if (visited !== nodes.length) throw new Error('Fix the circular prerequisite relationships before publishing.');
}

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
  const importInputRef = useRef(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [importCandidate, setImportCandidate] = useState(null);
  const [importError, setImportError] = useState('');
  const [importFailure, setImportFailure] = useState(null);
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
      return true;
    } catch (reason) {
      setError(reason.message);
      return false;
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
    setMessage('Saving new draft…');
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
      setMessage('Draft roadmap created and saved.');
      await loadRoadmaps();
      navigate('/admin/roadmaps');
    } catch (reason) {
      setMessage('');
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
    setMessage('Saving roadmap changes…');
    try {
      await api(`/admin/roadmaps/${selected._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          ...selectedRoadmapForm,
          objectives: selectedRoadmapForm.objectives.split('\n').map(item => item.trim()).filter(Boolean)
        })
      });
      const refreshed = await loadRoadmaps();
      setMessage(refreshed ? 'Roadmap changes saved to the server.' : 'Roadmap changes were saved, but the roadmap list could not be refreshed.');
    } catch (reason) {
      setMessage('');
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const exportRoadmap = async roadmap => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api(`/admin/roadmaps/${roadmap._id}/nodes`, { token });
      const exportData = {
        schemaVersion: ROADMAP_EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        roadmap: {
          title: roadmap.title,
          description: roadmap.description,
          coverImageUrl: roadmap.coverImageUrl || '',
          difficulty: roadmap.difficulty || 'beginner',
          estimatedDuration: roadmap.estimatedDuration || '',
          objectives: roadmap.objectives || [],
          audience: roadmap.audience || '',
          prerequisites: roadmap.prerequisites || '',
          status: roadmap.status
        },
        nodes: result.nodes.map(node => ({
          id: String(node._id),
          title: node.title,
          description: node.description || '',
          dependencies: (node.dependencies || []).map(String),
          position: node.position ?? 0,
          estimatedHours: node.estimatedHours ?? null,
          resources: node.resources || [],
          problems: node.problems || [],
          isRequired: node.isRequired !== false
        }))
      };
      const blob = new Blob([`${JSON.stringify(exportData, null, 2)}\n`], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${roadmap.title.trim().replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'roadmap'}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setMessage(`Exported ${exportData.nodes.length} topics as JSON.`);
    } catch (reason) {
      setError(`Roadmap export failed: ${reason.message}`);
    } finally {
      setBusy(false);
    }
  };
  const selectImportFile = async event => {
    const [file] = event.target.files || [];
    event.target.value = '';
    setImportCandidate(null);
    setImportFailure(null);
    setImportError('');
    setError('');
    setMessage('');
    if (!file) return;
    try {
      if (file.size > ROADMAP_EXPORT_LIMIT) throw new Error('Choose a JSON file smaller than 5 MB.');
      const parsed = JSON.parse(await file.text());
      const validated = validateRoadmapImport(parsed);
      setImportCandidate({ ...validated, fileName: file.name });
    } catch (reason) {
      setImportError(reason instanceof SyntaxError ? 'The selected file is not valid JSON.' : reason.message);
    }
  };
  const importRoadmap = async () => {
    if (!importCandidate || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    setImportError('');
    setImportFailure(null);
    let createdRoadmap = null;
    let importedCount = 0;
    try {
      const created = await api('/admin/roadmaps', {
        method: 'POST',
        token,
        body: JSON.stringify({ ...importCandidate.roadmap, status: 'draft' })
      });
      createdRoadmap = created.roadmap;
      if (!createdRoadmap?._id) throw new Error('The server did not return the new draft roadmap.');

      const importedIds = new Map();
      for (const node of importCandidate.orderedNodes) {
        const response = await api(`/admin/roadmaps/${createdRoadmap._id}/nodes`, {
          method: 'POST',
          token,
          body: JSON.stringify({
            title: node.title,
            description: node.description,
            dependencies: node.dependencies.map(id => importedIds.get(id)),
            position: node.position,
            estimatedHours: node.estimatedHours,
            resources: node.resources,
            problems: node.problems,
            isRequired: node.isRequired
          })
        });
        if (!response.node?._id) throw new Error(`The server did not return a saved identifier for "${node.title}".`);
        importedIds.set(node.id, String(response.node._id));
        importedCount += 1;
      }

      const importedTitle = createdRoadmap.title;
      setImportCandidate(null);
      const refreshed = await loadRoadmaps();
      setMessage(refreshed
        ? `Imported ${importedCount} topics as the new draft "${importedTitle}". No existing roadmap was changed.`
        : `Imported ${importedCount} topics as the new draft "${importedTitle}". The roadmap list could not be refreshed.`);
      navigate(`/admin/roadmaps/${createdRoadmap._id}/nodes`);
    } catch (reason) {
      if (createdRoadmap?._id) {
        setImportCandidate(null);
        const partialError = `Import stopped after ${importedCount} of ${importCandidate.nodes.length} topics. The new draft remains available for recovery; no existing roadmap was changed. ${reason.message}`;
        setImportFailure({
          id: createdRoadmap._id,
          title: createdRoadmap.title,
          importedCount,
          totalCount: importCandidate.nodes.length
        });
        await loadRoadmaps();
        setError(partialError);
        navigate(`/admin/roadmaps/${createdRoadmap._id}/nodes`);
      } else {
        setImportError(`Import failed before a draft was created: ${reason.message}`);
      }
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
    if (status === 'published' && !window.confirm(`Validate and publish "${roadmap.title}" to the student catalog?`)) return;
    setBusy(true);
    setError('');
    setMessage(status === 'published' ? 'Validating roadmap before publishing…' : `Saving roadmap status: ${status}…`);
    try {
      if (status === 'published') {
        const result = await api(`/admin/roadmaps/${roadmap._id}/nodes`, { token });
        validateRoadmapForPublish(roadmap, result.nodes);
      }
      await api(`/admin/roadmaps/${roadmap._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          status
        })
      });
      const refreshed = await loadRoadmaps();
      setMessage(refreshed
        ? status === 'published' ? 'Roadmap published and catalog status updated.' : `Roadmap marked ${status}.`
        : `Roadmap status saved as ${status}, but the roadmap list could not be refreshed.`);
    } catch (reason) {
      setMessage('');
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
    <input ref={importInputRef} className="roadmap-import-input" type="file" accept=".json,application/json" onChange={selectImportFile} />
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
      {routeSection === 'list' && <div className="roadmap-admin-toolbar">
        <button className="button button-outline" type="button" disabled={busy} onClick={() => importInputRef.current?.click()}><Upload size={15} /> Import JSON</button>
        <button className="button button-dark" type="button" onClick={() => {
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
      }}><Plus size={16} /> Create roadmap</button>
      </div>}
      {selected && routeSection !== 'create-roadmap' && <div className="roadmap-admin-toolbar">
        <button className="button button-outline" type="button" disabled={busy} onClick={() => importInputRef.current?.click()}><Upload size={15} /> Import as new draft</button>
        <button className="button button-outline" type="button" disabled={busy} onClick={() => exportRoadmap(selected)}><Download size={15} /> Export JSON</button>
      {routeSection === 'cycles' && selected.status !== 'archived' && <button className="button button-dark" type="button" onClick={() => {
        setEditingCycleId('');
        setCycleForm(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
        setError('');
        setMessage('');
        navigate(`/admin/roadmaps/${selectedRoadmap}/cycles/new`);
      }}><Plus size={16} /> Create cycle</button>}
      </div>}
    </div>

    {importError && <div className="notice error-notice roadmap-import-notice" role="alert">{importError}</div>}
    {importFailure && <div className="notice error-notice roadmap-import-notice" role="alert">
      <span>{importFailure.importedCount} of {importFailure.totalCount} topics were imported into the new draft “{importFailure.title}”. Existing roadmaps were not changed.</span>
      <Link to={`/admin/roadmaps/${importFailure.id}/nodes`}>Review the partial draft</Link>
    </div>}
    {importCandidate && <section className="roadmap-import-preview" aria-labelledby="roadmap-import-title">
      <div>
        <span className="roadmap-import-kicker">Validated JSON · schema v{ROADMAP_EXPORT_SCHEMA_VERSION}</span>
        <h2 id="roadmap-import-title">Import “{importCandidate.roadmap.title}” as a new draft?</h2>
        <p>{importCandidate.nodes.length} topics · {importCandidate.nodes.reduce((total, node) => total + node.dependencies.length, 0)} prerequisite links · {importCandidate.fileName}</p>
        <small>This creates a separate draft and never replaces an existing roadmap. Imported published status is reset to draft.</small>
      </div>
      <div className="roadmap-admin-actions">
        <button className="button button-dark" type="button" disabled={busy} onClick={importRoadmap}>{busy ? 'Importing…' : `Create draft and import ${importCandidate.nodes.length} topics`}</button>
        <button className="button button-outline" type="button" disabled={busy} onClick={() => setImportCandidate(null)}>Cancel</button>
      </div>
    </section>}

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
            {roadmap.status === 'draft' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(roadmap, 'published')}>{busy ? 'Validating…' : 'Publish'}</button>}
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
        <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Plus size={15} /> {busy ? 'Creating draft…' : 'Create draft roadmap'}</button><button className="button button-outline" type="button" disabled={busy} onClick={() => navigate('/admin/roadmaps')}>Cancel</button></div>
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
      {selected.status === 'draft' && routeSection === 'overview' && <aside className="roadmap-admin-capabilities">
        <p><strong>Publishing:</strong> this screen validates saved fields, links, and prerequisite cycles before changing status. The existing server endpoint only persists the status and does not provide API-level publish validation.</p>
      </aside>}
      {error && routeSection !== 'sessions' && <div className="notice error-notice" role="alert">{error}</div>}
      {message && routeSection !== 'sessions' && <div className="notice success-notice" role="status">{message}</div>}

      {routeSection === 'overview' && <section className="roadmap-admin-panel roadmap-studio-overview">
        <div className="roadmap-studio-overview-heading"><div><span className={`roadmap-studio-status status-${selected.status}`}>{selected.status}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><Link className="button button-dark" to="/admin/cycles">Manage cycles <ArrowRight size={15} /></Link></div>
        <div className="roadmap-studio-facts"><div><strong>{selected.cycles.length}</strong><span>Cycles</span></div><div><strong>{selected.audience || '—'}</strong><span>Expected audience</span></div><div><strong>{selected.objectives?.length || 0}</strong><span>Learning objectives</span></div></div>
        {selected.prerequisites && <p><strong>Prerequisites:</strong> {selected.prerequisites}</p>}
        <div className="roadmap-admin-actions">
          {selected.status === 'draft' && <button type="button" className="button button-outline" disabled={busy} onClick={() => updateRoadmapStatus(selected, 'published')}>{busy ? 'Validating…' : 'Publish roadmap'}</button>}
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
          <div className="roadmap-admin-actions"><button className="button button-dark" disabled={busy}><Save size={15} /> {busy ? 'Saving…' : selected.status === 'draft' ? 'Save draft changes' : 'Save changes'}</button></div>
        </form>
      </section>}
      {routeSection === 'settings' && selected.status === 'archived' && <div className="notice">Archived roadmaps are read-only.</div>}
      {routeSection === 'cycle-form' && selected.status === 'archived' && <div className="notice">Archived roadmaps cannot be changed.</div>}
      {routeSection === 'nodes' && <section className="roadmap-admin-panel learning-path-admin">
        <div className="roadmap-studio-section-heading"><div><h2>Learning path topics</h2><p>Create topics, link prerequisites, and add learning resources or practice problems.</p></div></div>
        <aside className="roadmap-admin-capabilities" aria-label="Roadmap editor capabilities">
          <p><strong>Persisted editing:</strong> set prerequisites and topic order in the editor below; each save uses the secured node API.</p>
          <p><strong>Not supported by the current backend:</strong> drag-to-move canvas nodes, connector handles, categories/subtopics, and roadmap analytics. The canvas here is a read-only student preview; no local-only controls are shown.</p>
        </aside>
        {selected.status === 'archived' ? <div className="notice">Archived roadmaps are read-only.</div> : <>
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
