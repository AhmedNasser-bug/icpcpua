import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, Maximize2, Plus, QrCode, RotateCcw, Save, Trophy, X, ZoomIn, ZoomOut } from 'lucide-react';
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

function sessionDateKey(session, fallbackTimeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: session.timeZone || fallbackTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(session.startsAt));
  const values = Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatCalendarMonth(date, timeZone) {
  const stableDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone }).format(stableDate);
}

function formatCalendarDay(date, options = {}) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC', ...options }).format(date);
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

function problemProgressKey(nodeId, problemUrl) {
  return JSON.stringify([String(nodeId), problemUrl]);
}

function clampGraphView(view, viewport, graph) {
  const contentWidth = graph.width * view.zoom;
  const contentHeight = graph.height * view.zoom;
  const padding = 24;
  const x = contentWidth <= viewport.width
    ? Math.min(viewport.width - contentWidth - padding, Math.max(padding, view.x))
    : Math.min(padding, Math.max(viewport.width - contentWidth - padding, view.x));
  const y = contentHeight <= viewport.height
    ? Math.min(viewport.height - contentHeight - padding, Math.max(padding, view.y))
    : Math.min(padding, Math.max(viewport.height - contentHeight - padding, view.y));
  return { ...view, x, y };
}

function LearningPath({ nodes = [], token, user, roadmapSlug }) {
  const viewportRef = useRef(null);
  const dialogCloseRef = useRef(null);
  const activePointers = useRef(new Map());
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [selectedId, setSelectedId] = useState('');
  const [isPanning, setIsPanning] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [solvedKeys, setSolvedKeys] = useState(() => new Set());
  const [progressStatus, setProgressStatus] = useState(user?.role === 'user' && token ? 'loading' : 'unavailable');
  const [progressError, setProgressError] = useState('');
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const [progressRetry, setProgressRetry] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => sessionDateKey({ startsAt: new Date() }));
  const [roadmapSessions, setRoadmapSessions] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState(user?.role === 'user' && token ? 'loading' : 'unavailable');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleRetry, setScheduleRetry] = useState(0);

  const graph = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [String(node._id), node]));
    const levels = new Map();
    const pending = [...nodes].sort((left, right) => left.position - right.position || left.title.localeCompare(right.title));
    while (pending.length) {
      const ready = pending.filter((node) => (node.dependencies || []).every((dependency) => !nodeById.has(String(dependency)) || levels.has(String(dependency))));
      const current = ready.length ? ready : pending;
      for (const node of current) {
        const dependencies = (node.dependencies || []).map(String).filter((dependency) => nodeById.has(dependency));
        const level = dependencies.length ? Math.max(...dependencies.map((dependency) => levels.get(dependency) || 0)) + 1 : 0;
        levels.set(String(node._id), level);
        pending.splice(pending.indexOf(node), 1);
      }
    }
    const grouped = [...levels.entries()].reduce((groups, [id, level]) => {
      groups[level] ||= [];
      groups[level].push(nodeById.get(id));
      return groups;
    }, []).map((level) => level.sort((left, right) => left.position - right.position || left.title.localeCompare(right.title)));
    const nodeWidth = 260;
    const nodeHeight = 82;
    const horizontalGap = 66;
    const verticalGap = 82;
    const padding = 44;
    const widestLevel = Math.max(1, ...grouped.map((level) => level.length));
    const width = padding * 2 + widestLevel * nodeWidth + Math.max(0, widestLevel - 1) * horizontalGap;
    const height = padding * 2 + grouped.length * (nodeHeight + verticalGap) - verticalGap;
    const positions = new Map();
    grouped.forEach((level, row) => {
      const rowWidth = level.length * nodeWidth + Math.max(0, level.length - 1) * horizontalGap;
      const startX = (width - rowWidth) / 2;
      level.forEach((node, column) => positions.set(String(node._id), {
        x: startX + column * (nodeWidth + horizontalGap),
        y: padding + row * (nodeHeight + verticalGap),
      }));
    });
    const edges = nodes.flatMap((node) => (node.dependencies || [])
      .map(String)
      .filter((dependency) => positions.has(dependency) && positions.has(String(node._id)))
      .map((dependency) => {
        const from = positions.get(dependency);
        const to = positions.get(String(node._id));
        const startX = from.x + nodeWidth / 2;
        const startY = from.y + nodeHeight;
        const endX = to.x + nodeWidth / 2;
        const endY = to.y;
        const curve = Math.max(30, (endY - startY) / 2);
        return { id: `${dependency}-${node._id}`, path: `M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}` };
      }));
    const layoutKey = JSON.stringify(nodes.map((node) => [
      String(node._id),
      node.title,
      node.position,
      (node.dependencies || []).map(String),
    ]));
    return { nodeById, positions, edges, width, height, nodeWidth, nodeHeight, layoutKey };
  }, [nodes]);

  const problemCounts = useMemo(() => {
    const counts = { total: 0, solved: 0, easy: 0, medium: 0, hard: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
    const byTopic = new Map();
    for (const node of nodes) {
      const topic = { total: 0, solved: 0 };
      for (const problem of node.problems || []) {
        const difficulty = ['easy', 'medium', 'hard'].includes(problem.difficulty) ? problem.difficulty : 'medium';
        const solved = solvedKeys.has(problemProgressKey(node._id, problem.url));
        counts[difficulty] += 1;
        counts.total += 1;
        topic.total += 1;
        if (solved) {
          counts.solved += 1;
          counts[`${difficulty}Solved`] += 1;
          topic.solved += 1;
        }
      }
      byTopic.set(String(node._id), topic);
    }
    return { ...counts, byTopic };
  }, [nodes, solvedKeys]);

  const fitView = useCallback(() => {
    if (!viewport.width || !viewport.height || !graph.width || !graph.height) return;
    const padding = 24;
    const availableWidth = Math.max(1, viewport.width - padding * 2);
    const availableHeight = Math.max(1, viewport.height - padding * 2);
    const zoom = Math.min(availableWidth / graph.width, availableHeight / graph.height, 1.8);
    setView(clampGraphView({
      zoom: Math.max(0.01, zoom),
      x: (viewport.width - graph.width * zoom) / 2,
      y: (viewport.height - graph.height * zoom) / 2,
    }, viewport, graph));
  }, [graph, viewport]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setViewport({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onWheel = useCallback((event) => {
    const element = viewportRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    changeZoom(view.zoom * factor, event.clientX - bounds.left, event.clientY - bounds.top);
  }, [graph, viewport, view.zoom]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    if (viewport.width && viewport.height) fitView();
  }, [fitView, graph.layoutKey, viewport.width, viewport.height]);

  useEffect(() => {
    let active = true;
    setSolvedKeys(new Set());
    setProgressError('');
    if (!token || user?.role !== 'user') {
      setProgressStatus('unavailable');
      return () => { active = false; };
    }
    setProgressStatus('loading');
    api(`/roadmaps/${encodeURIComponent(roadmapSlug)}/progress`, { token })
      .then(({ solvedProblems }) => {
        if (active) {
          setSolvedKeys(new Set(solvedProblems.map(({ nodeId, problemUrl }) => problemProgressKey(nodeId, problemUrl))));
          setProgressStatus('ready');
        }
      })
      .catch((reason) => {
        if (active) {
          setProgressError(reason.message);
          setProgressStatus('error');
        }
      });
    return () => { active = false; };
  }, [roadmapSlug, token, user?.role, progressRetry]);

  useEffect(() => {
    let active = true;
    setRoadmapSessions([]);
    setScheduleError('');
    if (!token || user?.role !== 'user') {
      setScheduleStatus('unavailable');
      return () => { active = false; };
    }
    setScheduleStatus('loading');
    api('/roadmaps/my', { token })
      .then(({ roadmaps = [] }) => {
        if (!active) return;
        const sessions = roadmaps
          .filter((item) => item.roadmap?.slug === roadmapSlug)
          .flatMap(({ cycle }) => (cycle?.sessions || []).map((session) => ({
            ...session,
            cycleId: cycle._id,
            cycleTitle: cycle.title,
            timeZone: session.timeZone || cycle.timeZone || 'UTC',
          })))
          .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
        setRoadmapSessions(sessions);
        setScheduleStatus('ready');
      })
      .catch((reason) => {
        if (active) {
          setScheduleError(reason.message);
          setScheduleStatus('error');
        }
      });
    return () => { active = false; };
  }, [roadmapSlug, scheduleRetry, token, user?.role]);

  const calendarYear = calendarMonth.getUTCFullYear();
  const calendarMonthIndex = calendarMonth.getUTCMonth();
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + 1, 0)).getUTCDate();
    const leadingDays = new Date(Date.UTC(calendarYear, calendarMonthIndex, 1)).getUTCDay();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - leadingDays + 1;
      if (day < 1 || day > daysInMonth) return null;
      const date = new Date(Date.UTC(calendarYear, calendarMonthIndex, day));
      const key = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date, key, day };
    });
  }, [calendarMonthIndex, calendarYear]);
  const sessionsByDate = useMemo(() => roadmapSessions.reduce((grouped, session) => {
    const key = sessionDateKey(session, session.timeZone);
    grouped[key] = [...(grouped[key] || []), session];
    return grouped;
  }, {}), [roadmapSessions]);
  const calendarWeeks = useMemo(() => Array.from({ length: 6 }, (_, week) => calendarDays.slice(week * 7, (week + 1) * 7)), [calendarDays]);
  const selectedDaySessions = sessionsByDate[selectedCalendarDay] || [];
  const difficultySegments = ['easy', 'medium', 'hard'].map((difficulty) => ({
    difficulty,
    count: problemCounts[difficulty],
  }));
  const gaugeSegments = [
    { difficulty: 'easy', length: 62.8, offset: 0 },
    { difficulty: 'medium', length: 94.2, offset: -68 },
    { difficulty: 'hard', length: 31.4, offset: -167 },
  ].map((segment) => {
    const solved = progressStatus === 'ready' ? problemCounts[`${segment.difficulty}Solved`] : 0;
    const total = problemCounts[segment.difficulty];
    const progressLength = total && solved ? segment.length * (solved / total) : 0;
    return { ...segment, progressLength };
  });
  const changeCalendarMonth = (amount) => {
    const nextMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + amount, 1));
    setCalendarMonth(nextMonth);
    setSelectedCalendarDay(`${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}-01`);
  };

  const selectedNode = selectedId ? graph.nodeById.get(selectedId) : null;
  const selectedProgress = selectedNode
    ? problemCounts.byTopic.get(String(selectedNode._id)) || { total: 0, solved: 0 }
    : { total: 0, solved: 0 };
  const selectedDependencies = (selectedNode?.dependencies || [])
    .map(String)
    .map((dependency) => graph.nodeById.get(dependency))
    .filter(Boolean);

  useEffect(() => {
    if (!selectedNode) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogCloseRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedId('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedNode]);

  const changeZoom = (nextZoom, anchorX = viewport.width / 2, anchorY = viewport.height / 2) => {
    const zoom = Math.max(0.01, Math.min(2.4, nextZoom));
    setView((current) => clampGraphView({
      zoom,
      x: anchorX - ((anchorX - current.x) / current.zoom) * zoom,
      y: anchorY - ((anchorY - current.y) / current.zoom) * zoom,
    }, viewport, graph));
  };

  const resetView = () => setView(clampGraphView({
    zoom: 1,
    x: (viewport.width - graph.width) / 2,
    y: (viewport.height - graph.height) / 2,
  }, viewport, graph));

  const onPointerDown = (event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const onNode = Boolean(event.target.closest('.learning-path-node'));
    if (event.target.closest('.learning-graph-controls')) return;
    const captureTarget = onNode ? event.target.closest('.learning-path-node') : event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.current.size === 2) {
      event.preventDefault();
      const [first, second] = [...activePointers.current.values()];
      gesture.current = {
        kind: 'pinch',
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom: view.zoom,
        x: view.x,
        y: view.y,
        centerX: (first.x + second.x) / 2,
        centerY: (first.y + second.y) / 2,
        moved: false,
      };
      return;
    }
    gesture.current = { kind: 'pan', startX: event.clientX, startY: event.clientY, x: view.x, y: view.y, moved: false };
  };

  const onPointerMove = (event) => {
    if (activePointers.current.has(event.pointerId)) activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const currentGesture = gesture.current;
    if (!currentGesture) return;
    if (currentGesture.kind === 'pinch' && activePointers.current.size >= 2) {
      const [first, second] = [...activePointers.current.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const bounds = viewportRef.current.getBoundingClientRect();
      const scaleRatio = distance / Math.max(1, currentGesture.distance);
      const zoom = Math.max(0.01, Math.min(2.4, currentGesture.zoom * scaleRatio));
      const anchorX = currentGesture.centerX - bounds.left;
      const anchorY = currentGesture.centerY - bounds.top;
      const nextX = anchorX - ((anchorX - currentGesture.x) / currentGesture.zoom) * zoom + centerX - currentGesture.centerX;
      const nextY = anchorY - ((anchorY - currentGesture.y) / currentGesture.zoom) * zoom + centerY - currentGesture.centerY;
      gesture.current.moved = true;
      setIsPanning(true);
      setView(clampGraphView({ x: nextX, y: nextY, zoom }, viewport, graph));
      return;
    }
    if (currentGesture.kind !== 'pan') return;
    const deltaX = event.clientX - currentGesture.startX;
    const deltaY = event.clientY - currentGesture.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) currentGesture.moved = true;
    if (currentGesture.moved) {
      event.preventDefault();
      setIsPanning(true);
      setView(clampGraphView({ ...view, x: currentGesture.x + deltaX, y: currentGesture.y + deltaY }, viewport, graph));
    }
  };

  const onPointerUp = (event) => {
    activePointers.current.delete(event.pointerId);
    setIsPanning(false);
    if (gesture.current?.moved) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    if (activePointers.current.size < 2) gesture.current = null;
  };

  const toggleProblem = async (node, problem) => {
    const key = problemProgressKey(node._id, problem.url);
    if (!token || user?.role !== 'user' || progressStatus !== 'ready' || pendingKeys.has(key)) return;
    const solved = !solvedKeys.has(key);
    setPendingKeys((current) => new Set(current).add(key));
    setSolvedKeys((current) => {
      const next = new Set(current);
      if (solved) next.add(key);
      else next.delete(key);
      return next;
    });
    setProgressError('');
    try {
      const result = await api(`/roadmaps/${encodeURIComponent(roadmapSlug)}/progress`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ nodeId: String(node._id), problemUrl: problem.url, solved }),
      });
      const stored = result.solvedProblems.some(({ nodeId, problemUrl }) => problemProgressKey(nodeId, problemUrl) === key);
      setSolvedKeys((current) => {
        const next = new Set(current);
        if (stored) next.add(key);
        else next.delete(key);
        return next;
      });
    } catch (reason) {
      setSolvedKeys((current) => {
        const next = new Set(current);
        if (solved) next.delete(key);
        else next.add(key);
        return next;
      });
      setProgressError(reason.message);
    } finally {
      setPendingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  return <section className="learning-path-section" aria-labelledby="learning-path-heading">
    <header className="learning-path-heading">
      <div><h2 id="learning-path-heading">Learning <span>Path</span></h2></div>
      <div className="learning-path-legend" aria-label="Problem difficulty legend">
        <span><i className="legend-easy" /> Easy</span><span><i className="legend-medium" /> Medium</span><span><i className="legend-hard" /> Hard</span>
      </div>
    </header>
    {!nodes.length ? <div className="empty-state"><h3>Learning topics are coming soon.</h3><p>This roadmap’s learning path is being prepared.</p></div> : <div className="learning-roadmap-layout">
      <section className="learning-graph-panel" aria-label="Interactive learning roadmap">
        <div className={`learning-graph-canvas${isPanning ? ' is-panning' : ''}`}
          ref={viewportRef}
          aria-label="Interactive graph. Drag to pan, use the wheel to zoom, or pinch on touch screens."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onLostPointerCapture={onPointerUp}>
          <div className="learning-path-board" style={{
            width: graph.width,
            height: graph.height,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
          }}>
            <svg className="learning-path-edges" width={graph.width} height={graph.height} aria-hidden="true">
              {graph.edges.map((edge) => <path key={edge.id} d={edge.path} />)}
            </svg>
            {nodes.map((node, index) => {
              const position = graph.positions.get(String(node._id));
              const progress = problemCounts.byTopic.get(String(node._id)) || { total: 0, solved: 0 };
              const progressPercent = progress.total ? Math.round((progress.solved / progress.total) * 100) : 0;
              return <button
                className={`learning-path-node${selectedId === String(node._id) ? ' selected' : ''}`}
                data-node-color={index % 6}
                style={{ left: position.x, top: position.y, width: graph.nodeWidth }}
                key={node._id}
                type="button"
                aria-pressed={selectedId === String(node._id)}
                onClick={(event) => {
                  if (suppressClick.current) {
                    event.preventDefault();
                    suppressClick.current = false;
                    return;
                  }
                  setSelectedId(String(node._id));
                }}
              >
                <strong>{node.title}</strong>
                <span className="learning-path-node-progress" role="progressbar" aria-label={`${node.title} solved problems`} aria-valuemin={0} aria-valuemax={progress.total || 1} aria-valuenow={progress.solved}>
                  <span style={{ width: `${progressPercent}%` }} />
                </span>
              </button>;
            })}
          </div>
          <div className="learning-graph-controls" aria-label="Graph view controls">
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => changeZoom(view.zoom * 1.2)}><ZoomIn size={17} /></button>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => changeZoom(view.zoom / 1.2)}><ZoomOut size={17} /></button>
            <button type="button" aria-label="Fit view" title="Fit all topics" onClick={fitView}><Maximize2 size={16} /></button>
            <button type="button" aria-label="Reset view" title="Reset zoom and center" onClick={resetView}><RotateCcw size={16} /></button>
          </div>
          <span className="learning-graph-hint">Drag to pan · Scroll to zoom</span>
        </div>
      </section>
      <aside className="learning-roadmap-sidebar" aria-label="Roadmap progress and schedule">
        <section className="learning-progress-card" aria-label="Roadmap problem progress">
          <div className="learning-progress-overview">
            <div className="learning-sidebar-difficulty-list">
              {difficultySegments.map(({ difficulty, count }) => (
                <div className="learning-sidebar-difficulty" key={difficulty}>
                  <span>{difficulty}</span>
                  <strong>{progressStatus === 'ready' ? problemCounts[`${difficulty}Solved`] : '—'} / {count}</strong>
                </div>
              ))}
            </div>
            <div
              className="learning-progress-gauge"
              role="progressbar"
              aria-label="Overall roadmap progress"
              aria-valuemin={0}
              aria-valuemax={problemCounts.total || 1}
              aria-valuenow={progressStatus === 'ready' ? problemCounts.solved : undefined}
              aria-valuetext={progressStatus === 'ready'
                ? `${problemCounts.solved} of ${problemCounts.total} problems solved`
                : progressStatus === 'loading' ? 'Loading progress' : 'Progress is unavailable'}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                {gaugeSegments.map(({ difficulty, length, offset, progressLength }) => (
                  <g className={`learning-progress-gauge-segment segment-${difficulty}`} key={difficulty}>
                    <circle className="learning-progress-gauge-track" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${length} 188.4`} strokeDashoffset={offset} />
                    {progressLength > 0
                      ? <circle className="learning-progress-gauge-value" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${progressLength} 251.2`} strokeDashoffset={offset} />
                      : <circle className="learning-progress-gauge-marker" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray="1 250.2" strokeDashoffset={offset} />}
                  </g>
                ))}
              </svg>
              <div className="learning-progress-gauge-label">
                <strong>{progressStatus === 'ready' ? problemCounts.solved : '—'}</strong>
                <span>/{problemCounts.total}</span>
                <small>Solved</small>
              </div>
            </div>
          </div>
          {progressStatus === 'unavailable' && <p className="learning-sidebar-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your progress.</>}</p>}
          {progressStatus === 'error' && <p className="learning-progress-error" role="alert">{progressError} <button type="button" onClick={() => setProgressRetry((current) => current + 1)}>Retry</button></p>}
        </section>

        <section className="learning-calendar-card" aria-labelledby="learning-calendar-title">
          <header className="learning-sidebar-card-heading">
            <h3 id="learning-calendar-title">Roadmap calendar</h3>
            <CalendarDays size={18} aria-hidden="true" />
          </header>
          <p className="learning-calendar-description">Scheduled sessions from cycles you joined.</p>
          {scheduleStatus === 'loading' && <p className="learning-sidebar-message">Loading your enrolled sessions…</p>}
          {scheduleStatus === 'unavailable' && <p className="learning-sidebar-message"><Link to="/login">Sign in</Link> to see your cycle schedule.</p>}
          {scheduleStatus === 'error' && <p className="learning-progress-error" role="alert">{scheduleError} <button type="button" onClick={() => setScheduleRetry((current) => current + 1)}>Retry</button></p>}
          {scheduleStatus === 'ready' && <>
            <div className="learning-calendar-toolbar">
              <button type="button" aria-label="Previous month" onClick={() => changeCalendarMonth(-1)}><ChevronLeft size={17} /></button>
              <h4 aria-live="polite">{formatCalendarMonth(calendarMonth)}</h4>
              <button type="button" aria-label="Next month" onClick={() => changeCalendarMonth(1)}><ChevronRight size={17} /></button>
            </div>
            <div className="learning-calendar-grid" role="grid" aria-label={formatCalendarMonth(calendarMonth)}>
              <div className="learning-calendar-week learning-calendar-weekdays" role="row">
                {weekdays.map(([weekday]) => <span role="columnheader" key={weekday}>{weekday.slice(0, 2)}</span>)}
              </div>
              {calendarWeeks.map((week, weekIndex) => <div className="learning-calendar-week" role="row" key={`week-${weekIndex}`}>
                {week.map((cell, dayIndex) => cell ? (
                  <button
                    className={`learning-calendar-day${selectedCalendarDay === cell.key ? ' is-selected' : ''}${sessionsByDate[cell.key]?.length ? ' has-session' : ''}`}
                    type="button"
                    role="gridcell"
                    aria-label={`${formatCalendarDay(cell.date, { weekday: 'long', month: 'long', day: 'numeric' })}${sessionsByDate[cell.key]?.length ? `, ${sessionsByDate[cell.key].length} scheduled sessions` : ''}`}
                    aria-pressed={selectedCalendarDay === cell.key}
                    key={cell.key}
                    onClick={() => setSelectedCalendarDay(cell.key)}
                  >
                    <span>{cell.day}</span>
                    {sessionsByDate[cell.key]?.length > 0 && <i aria-hidden="true" />}
                  </button>
                ) : <span className="learning-calendar-day is-outside" aria-hidden="true" key={`outside-${weekIndex}-${dayIndex}`} />)}
              </div>)}
            </div>
            <div className="learning-calendar-session-list" aria-live="polite">
              <h4>{formatCalendarDay(new Date(`${selectedCalendarDay}T12:00:00Z`), { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
              {selectedDaySessions.length ? selectedDaySessions.map((session) => (
                <Link
                  className={`learning-calendar-session${session.status === 'cancelled' ? ' is-cancelled' : ''}`}
                  key={session._id}
                  to={`/roadmaps/${encodeURIComponent(roadmapSlug)}/cycles/${encodeURIComponent(session.cycleId)}`}
                >
                  <span><strong>{session.title}</strong><small>{session.cycleTitle}</small></span>
                  <small>{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: session.timeZone }).format(new Date(session.startsAt))}</small>
                </Link>
              )) : <p>{roadmapSessions.length ? 'No sessions scheduled for this day.' : 'No enrolled cycle sessions yet.'}</p>}
            </div>
            {!roadmapSessions.length && <Link className="learning-calendar-cycles-link" to="/trainings">Explore Trainings <ArrowRight size={14} /></Link>}
          </>}
        </section>
      </aside>

      {selectedNode && <div className="learning-node-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setSelectedId('');
      }}>
        <aside className="learning-node-dialog" role="dialog" aria-modal="true" aria-labelledby="learning-node-dialog-title">
          <button ref={dialogCloseRef} className="learning-node-dialog-close" type="button" aria-label="Close topic details" onClick={() => setSelectedId('')}><X size={20} /></button>
          <header className="learning-node-dialog-header">
            <h2 id="learning-node-dialog-title">{selectedNode.title}</h2>
            {selectedNode.description && <p className="learning-node-dialog-description">{selectedNode.description}</p>}
            <p>{progressStatus === 'ready' ? `${selectedProgress.solved} / ${selectedProgress.total} solved` : `${selectedProgress.total} ${selectedProgress.total === 1 ? 'problem' : 'problems'}`}</p>
            <div className="learning-node-progress-track" style={{ '--progress-percent': `${selectedProgress.total ? (selectedProgress.solved / selectedProgress.total) * 100 : 0}%` }} role="progressbar" aria-label={`${selectedNode.title} solved problems`} aria-valuemin={0} aria-valuemax={selectedProgress.total || 1} aria-valuenow={selectedProgress.solved}>
            </div>
          </header>
          <section className="learning-node-prerequisites" aria-labelledby="learning-node-prerequisites-title">
            <h3 id="learning-node-prerequisites-title">Prerequisites</h3>
            {selectedDependencies.length > 0 ? <div className="learning-node-prerequisite-list">
              {selectedDependencies.map((dependency) => {
                const counts = problemCounts.byTopic.get(String(dependency._id)) || { total: 0, solved: 0 };
                return <button key={dependency._id} type="button" onClick={() => setSelectedId(String(dependency._id))}>
                  <strong>{dependency.title}</strong>
                  <span>{progressStatus === 'ready' ? `${counts.solved} / ${counts.total} solved` : `${counts.total} ${counts.total === 1 ? 'problem' : 'problems'}`}</span>
                </button>;
              })}
            </div> : <p className="learning-topic-empty">No prerequisites for this topic.</p>}
          </section>
          <section className="learning-node-roadmap-progress" aria-label="Overall roadmap progress">
            <div><span>Roadmap progress</span><strong>{progressStatus === 'ready' ? `${problemCounts.solved} / ${problemCounts.total} solved` : progressStatus === 'loading' ? 'Loading…' : 'Sign in to track progress'}</strong></div>
            <div className="learning-node-difficulty-totals">
              {['easy', 'medium', 'hard'].map((difficulty) => <span key={difficulty}><i className={`legend-${difficulty}`} />{difficulty} {progressStatus === 'ready' ? `${problemCounts[`${difficulty}Solved`]}/${problemCounts[difficulty]}` : '—'}</span>)}
            </div>
          </section>
          {progressStatus === 'unavailable' && <p className="learning-node-progress-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your problem progress.</>}</p>}
          {(progressStatus === 'error' || progressError) && <p className="learning-progress-error" role="alert">{progressError} {progressStatus === 'error' && <button type="button" onClick={() => setProgressRetry((current) => current + 1)}>Retry</button>}</p>}
          <section className="learning-node-problems" aria-labelledby="learning-node-problems-title">
            <h3 id="learning-node-problems-title">Problems <span>{selectedNode.problems?.length || 0}</span></h3>
            {selectedNode.problems?.length ? <div className="learning-node-problem-list">
              <div className="learning-node-problem-header" aria-hidden="true"><span>Status</span><span>Problem</span><span>Difficulty</span><span>Open</span></div>
              {(selectedNode.problems || []).map((problem, index) => {
                const key = problemProgressKey(selectedId, problem.url);
                const difficulty = ['easy', 'medium', 'hard'].includes(problem.difficulty) ? problem.difficulty : 'medium';
                const checked = solvedKeys.has(key);
                return <div className={`learning-node-problem-row${checked ? ' solved' : ''}`} key={`${problem.url}-${index}`}>
                  <label className="learning-problem-check">
                    <input type="checkbox" aria-label={`Mark ${problem.title} as solved`} checked={checked} disabled={progressStatus !== 'ready' || pendingKeys.has(key)} onChange={() => toggleProblem(selectedNode, problem)} />
                    <span className="learning-problem-checkmark" />
                  </label>
                  <a className="learning-node-problem-title" href={problem.url} target="_blank" rel="noreferrer">{problem.title}</a>
                  <span className={`learning-problem-difficulty difficulty-${difficulty}`}>{difficulty}</span>
                  <a className="learning-node-problem-open" href={problem.url} target="_blank" rel="noreferrer" aria-label={`Open ${problem.title}`}><ExternalLink size={16} /></a>
                </div>;
              })}
            </div> : <p className="learning-topic-empty">No problems added to this topic yet.</p>}
          </section>
          {selectedNode.resources?.length > 0 && <section className="learning-node-resources">
            <h3>Resources</h3>
            {selectedNode.resources.map((resource) => <a key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer">{resource.title} <ExternalLink size={14} /></a>)}
          </section>}
        </aside>
      </div>}
    </div>}
  </section>;
}

function RoadmapCard({ roadmap, index = 0 }) {
  return <article className={`roadmap-card accent-${index % 4}`}>
    {roadmap.coverImageUrl && <img className="roadmap-cover-image" src={roadmap.coverImageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
    <div className="roadmap-card-heading"><span className="category-label">{roadmap.difficulty || 'beginner'}</span>{roadmap.estimatedDuration && <span>{roadmap.estimatedDuration}</span>}</div>
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
    <div className="page-heading"><h1>Learning <span>roadmaps</span></h1><Link className="text-link" to="/trainings">Looking for a training cycle? Explore Trainings <ArrowRight size={15} /></Link></div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {loading ? <LoadingState /> : roadmaps.length
      ? <section className="roadmap-grid" aria-label="Published learning roadmaps">{roadmaps.map((roadmap, index) => <RoadmapCard key={roadmap._id} roadmap={roadmap} index={index} />)}</section>
      : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h2>No roadmaps published yet.</h2><p>New learning paths will appear here when administrators publish them.</p></div>}
  </main>;
}

export function RoadmapDetailsPage({ token, user }) {
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
  return <main className="page-wrap roadmaps-page roadmap-details-page">
    <LearningPath nodes={roadmap.nodes || []} token={token} user={user} roadmapSlug={roadmap.slug} />
  </main>;
}

function CycleCard({ cycle, roadmapSlug, roadmapTitle, token, user }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const enroll = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/roadmaps/${encodeURIComponent(roadmapSlug)}/cycles/${encodeURIComponent(cycle._id)}/enroll`, { method: 'POST', token });
      navigate(`/roadmaps/${encodeURIComponent(roadmapSlug)}/cycles/${cycle._id}`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  return <article className="roadmap-cycle-card">
    <div className="roadmap-card-heading"><span className="category-label">{cycle.difficulty}</span><span>{cycle.sessionCount ?? cycle.sessionsPerWeek} {cycle.sessionCount === undefined ? 'sessions / week' : 'sessions'}</span></div>
    {roadmapTitle && <Link className="roadmap-cycle-roadmap" to={`/roadmaps/${encodeURIComponent(roadmapSlug)}`}>{roadmapTitle}</Link>}
    <h3>{cycle.title}</h3><p>{cycle.description}</p>
    <p className="roadmap-cycle-dates"><CalendarDays size={15} /> {cycle.startDate} – {cycle.endDate}</p>
    <p className="roadmap-cycle-dates"><Clock3 size={15} /> {cycle.sessionsPerWeek} sessions / week · Registration closes {eventDate(cycle.registrationClosesAt, { weekday: undefined, year: undefined })}</p>
    {cycle.location && <p className="roadmap-cycle-dates"><MapPin size={15} /> {cycle.location}</p>}
    <p className="roadmap-cycle-dates">{cycle.enrolled ? 'You are enrolled' : cycle.registrationOpen ? 'Registration open' : 'Registration closed'}{cycle.capacity !== null && cycle.capacity !== undefined && ` · ${cycle.remainingCapacity} seats remaining`}</p>
    {error && <div className="notice error-notice roadmap-cycle-enroll-error" role="alert">{error}</div>}
    <div className="roadmap-cycle-actions">
      {cycle.status === 'published' && cycle.registrationOpen && !cycle.enrolled && (user?.role === 'user'
        ? <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Registering...' : 'Register for cycle'} <ArrowRight size={15} /></button>
        : null)}
      <Link className="button button-outline" to={`/roadmaps/${encodeURIComponent(roadmapSlug)}/cycles/${cycle._id}`}>View cycle <ArrowRight size={15} /></Link>
    </div>
  </article>;
}

export function TrainingsPage({ token, user }) {
  const location = useLocation();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/roadmaps/cycles', { token });
      setCycles(result.cycles);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (!user || !token) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <main className="page-wrap roadmaps-page trainings-page">
    <div className="page-heading"><h1>Trainings</h1><p>Join a structured training cycle | build your skills through guided sessions</p></div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={load}>Try again</button></div>}
    {loading ? <LoadingState>Loading training cycles...</LoadingState> : cycles.length
      ? <section className="roadmap-cycle-grid" aria-label="Available training cycles">{cycles.map((cycle) => <CycleCard key={cycle._id} cycle={cycle} roadmapSlug={cycle.roadmap.slug} roadmapTitle={cycle.roadmap.title} token={token} user={user} />)}</section>
      : <div className="empty-state"><h2>No training cycles available yet.</h2><p>Published training cycles will appear here when they are available.</p></div>}
  </main>;
}

export function RoadmapCyclePage({ token, user }) {
  const { slug, cycleId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const sessionDialogRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/roadmaps/${encodeURIComponent(slug)}/cycles/${encodeURIComponent(cycleId)}`, { token }));
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [cycleId, slug, token]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedSession) return undefined;
    const previousFocus = document.activeElement;
    sessionDialogRef.current?.querySelector('.roadmap-session-dialog-close')?.focus();
    const handleDialogKeys = (event) => {
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
      await api(`/roadmaps/${encodeURIComponent(slug)}/cycles/${encodeURIComponent(cycleId)}/enroll`, { method: 'POST', token });
      setSuccess('You are enrolled. Your cycle is now available in My Activities.');
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user || !token) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (loading) return <main className="page-wrap"><LoadingState /></main>;
  if (error && !data) return <main className="page-wrap"><div className="notice error-notice" role="alert">{error}</div></main>;
  if (!data) return null;
  const { roadmap, cycle, enrolled, sessions } = data;
  const cycleDescription = cycle.description?.trim();
  const roadmapDescription = roadmap.title.trim().toLowerCase();
  const showCycleDescription = cycleDescription &&
    cycleDescription.toLowerCase() !== roadmapDescription &&
    cycleDescription.toLowerCase() !== `roadmap ${roadmapDescription}`;
  const calendarYear = calendarMonth.getUTCFullYear();
  const calendarMonthIndex = calendarMonth.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + 1, 0)).getUTCDate();
  const leadingDays = new Date(Date.UTC(calendarYear, calendarMonthIndex, 1)).getUTCDay();
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leadingDays + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(Date.UTC(calendarYear, calendarMonthIndex, day));
    const key = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { date, key, day };
  });
  const sessionsByDate = sessions.reduce((grouped, session) => {
    const key = sessionDateKey(session, cycle.timeZone);
    grouped[key] = [...(grouped[key] || []), session];
    return grouped;
  }, {});
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => formatCalendarDay(new Date(Date.UTC(2024, 0, index + 7))));
  const calendarWeekCount = Math.ceil((leadingDays + daysInMonth) / 7);
  const calendarWeeks = Array.from({ length: calendarWeekCount }, (_, week) => calendarCells.slice(week * 7, (week + 1) * 7));
  const todayKey = sessionDateKey({ startsAt: new Date(), timeZone: cycle.timeZone }, cycle.timeZone);

  return <main className="page-wrap roadmaps-page">
    <Link className="text-link" to={`/roadmaps/${roadmap.slug}/cycles`}>← {roadmap.title} cycles</Link>
    <div className="roadmap-detail-header"><h1>{cycle.title}</h1>{showCycleDescription && <p>{cycleDescription}</p>}
      <section className="roadmap-cycle-data-card" aria-label="Cycle details">
        <div><CalendarDays size={17} /><span><small>Cycle dates</small><strong>{cycle.startDate} – {cycle.endDate}</strong></span></div>
        <div><Clock3 size={17} /><span><small>Weekly schedule</small><strong>{cycle.sessionsPerWeek} days / week · {cycle.sessionDurationMinutes} minutes</strong></span></div>
        {cycle.location && <div><MapPin size={17} /><span><small>Location</small><strong>{cycle.location}</strong></span></div>}
        <div><BookOpen size={17} /><span><small>Enrollment</small><strong>{cycle.enrollmentCount}{cycle.capacity ? ` / ${cycle.capacity}` : ''} enrolled</strong></span></div>
      </section>
    </div>
    {cycle.objectives?.length > 0 && <section className="roadmap-content-section"><h2>Cycle objectives</h2><ul className="roadmap-objectives">{cycle.objectives.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {success && <div className="notice success-notice" role="status">{success}</div>}
    {!enrolled && cycle.status === 'published' && <section className="roadmap-enroll-panel">
      <div><h2>Join this cycle</h2><p>Enrollment covers every scheduled session in the cycle. There is no session-by-session registration.</p><small>Registration: {eventDate(cycle.registrationOpensAt)} – {eventDate(cycle.registrationClosesAt)}</small></div>
      {user?.role === 'user' && data.registrationOpen && <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling...' : 'Enroll in cycle'} <ArrowRight size={16} /></button>}
      {!data.registrationOpen && <span className="check-status">Registration is currently closed.</span>}
    </section>}
    <section className="roadmap-content-section">
      <h2>Session schedule</h2>
      {sessions.length ? <div className="roadmap-calendar" aria-label={`${cycle.title} session calendar`}>
        <div className="roadmap-calendar-toolbar">
          <button className="roadmap-calendar-nav" type="button" aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft size={20} /></button>
          <h3 aria-live="polite">{formatCalendarMonth(calendarMonth, cycle.timeZone)}</h3>
          <button className="roadmap-calendar-nav" type="button" aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><ChevronRight size={20} /></button>
        </div>
        <div className="roadmap-calendar-grid" role="grid" aria-label={formatCalendarMonth(calendarMonth, cycle.timeZone)}>
          <div className="roadmap-calendar-week roadmap-calendar-head" role="row">
            {weekdayLabels.map((weekday, index) => <div className="roadmap-calendar-weekday" role="columnheader" key={`${index}-${weekday}`}>{weekday}</div>)}
          </div>
          {calendarWeeks.map((week, weekIndex) => <div className="roadmap-calendar-week" role="row" key={`week-${weekIndex}`}>
            {week.map((cell, dayIndex) => cell ? <div className={`roadmap-calendar-day${cell.key === todayKey ? ' is-today' : ''}`} role="gridcell" key={cell.key} aria-label={`${formatCalendarDay(cell.date, { weekday: 'long', month: 'long', day: 'numeric' })}${sessionsByDate[cell.key]?.length ? `, ${sessionsByDate[cell.key].length} sessions` : ''}`}>
              <span className="roadmap-calendar-day-number" aria-hidden="true">{cell.day}</span>
              <div className="roadmap-calendar-events">
                {(sessionsByDate[cell.key] || []).map((session) => <button className={`roadmap-calendar-event accent-${(session.ordinal || 0) % 4}${session.status === 'cancelled' ? ' is-cancelled' : ''}`} type="button" key={session._id} onClick={() => setSelectedSession(session)} aria-label={`${session.title}, ${formatSessionTime(session)}${session.status === 'cancelled' ? ', cancelled' : ''}`}>
                  <span>{session.title}</span>
                  <small>{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: session.timeZone || cycle.timeZone }).format(new Date(session.startsAt))}</small>
                </button>)}
              </div>
            </div> : <div className="roadmap-calendar-day is-outside" role="gridcell" aria-hidden="true" key={`outside-${weekIndex}-${dayIndex}`} />)}
          </div>)}
        </div>
        <p className="roadmap-calendar-hint">Select a session to view its details.</p>
      </div>
        : <div className="empty-state"><h3>The schedule is being prepared.</h3><p>Sessions will appear here after an administrator confirms the schedule.</p></div>}
    </section>
    {selectedSession && <div className="roadmap-session-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSession(null); }}>
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
          {[...(selectedSession.materials || []), ...(selectedSession.problemSets || [])].map((resource) => <a className="roadmap-resource-link" key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {resource.title}</a>)}
        </div>}
        {!enrolled && cycle.status === 'published' && selectedSession.status !== 'cancelled' && (user
          ? <button className="button button-dark" type="button" disabled={busy} onClick={enroll}>{busy ? 'Enrolling...' : 'Enroll in cycle'} <ArrowRight size={16} /></button>
          : <Link className="button button-dark" to="/login">Sign in to enroll <ArrowRight size={16} /></Link>)}
      </section>
    </div>}
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

export function MyRoadmapsSection({ token }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/roadmaps/my', { token })
      .then(({ roadmaps: result }) => { if (active) setRoadmaps(result); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey, token]);

  const groupedRoadmaps = roadmaps.reduce((groups, item) => {
    const { roadmap, cycle, enrollment, progress } = item;
    const key = roadmap?._id || `archived-${cycle._id}`;
    let group = groups.find((candidate) => candidate.key === key);
    if (!group) {
      group = { key, roadmap, cycles: [] };
      groups.push(group);
    }
    group.cycles.push({ cycle, enrollment, progress });
    return groups;
  }, []);

  return <section className="my-activities-section my-roadmaps-section" aria-labelledby="my-roadmaps-heading">
    <div className="my-activities-section-heading"><div><h2 id="my-roadmaps-heading">My Roadmaps</h2></div><Link className="text-link" to="/roadmaps">Explore roadmaps <ArrowRight size={15} /></Link></div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>}
    {loading ? <LoadingState>Loading your roadmaps...</LoadingState> : error ? null : groupedRoadmaps.length ? <section className="my-roadmap-list" aria-label="Joined roadmaps">{groupedRoadmaps.map(({ key, roadmap, cycles }) => <article className="my-roadmap-card my-activities-roadmap-card" key={key}>
      <div className="roadmap-card-heading"><span className="category-label">JOINED ROADMAP</span><span>{cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'} joined</span></div>
      <h3>{roadmap?.slug ? <Link to={`/roadmaps/${roadmap.slug}`}>{roadmap.title}</Link> : roadmap?.title || 'Archived roadmap'}</h3>
      {roadmap?.description && <p className="my-roadmap-description">{roadmap.description}</p>}
      <div className="my-roadmap-cycles">{cycles.map(({ cycle, enrollment, progress }) => <article className="my-roadmap-cycle-card" key={cycle._id}>
        <div className="roadmap-card-heading"><span className="category-label">{cycle.status} · {cycle.difficulty}</span><span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span></div>
        <h4>{cycle.title}</h4><p>{cycle.startDate} – {cycle.endDate}</p>
        <div className="roadmap-progress-stats"><div><strong>{progress.completedSessions}/{progress.totalSessions}</strong><small>Sessions completed</small></div><div><strong>{progress.progressPercentage}%</strong><small>Session progress</small></div><div><strong>{progress.attendancePercentage}%</strong><small>Attendance · {progress.sessionsAttended} present</small></div></div>
        <div className="roadmap-progress-track" role="progressbar" aria-label={`${cycle.title} session progress`} aria-valuenow={progress.progressPercentage} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progress.progressPercentage}%` }} /></div>
        <div className="roadmap-upcoming-sessions"><h5>Next session</h5>{cycle.sessions.find((session) => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()) ? <p><CalendarDays size={14} /> {formatSessionTime(cycle.sessions.find((session) => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()))} · {cycle.sessions.find((session) => session.status !== 'cancelled' && new Date(session.startsAt) >= new Date()).title}</p> : <p>No upcoming sessions scheduled.</p>}</div>
        <p><Trophy size={15} /> {progress.points} roadmap points</p>
        <Link className="button button-outline" to={`/roadmaps/${encodeURIComponent(roadmap.slug)}/cycles/${cycle._id}`}>View cycle details <ArrowRight size={15} /></Link>
      </article>)}</div>
    </article>)}</section> : <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><h3>No joined roadmaps yet.</h3><p>Join a cycle to see its roadmap and learning progress here.</p><Link className="button button-dark" to="/roadmaps">Browse roadmaps <ArrowRight size={16} /></Link></div>}
  </section>;
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
    <Link className="text-link" to="/my-activities">← My Activities</Link>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {data && <section className="roadmap-checkin-card"><span className="eyebrow">SESSION ATTENDANCE</span><h1>{data.session.title}</h1><p>{formatSessionTime(data.session)}</p>
      {success && <div className="notice success-notice" role="status">{success}</div>}
      {data.attendance ? <div className="notice success-notice"><Check size={17} /> Already checked in · {data.attendance.pointsAwarded} points</div>
        : <button className="button button-dark" type="button" disabled={busy || !data.checkInWindow.isOpen} onClick={checkIn}>{busy ? 'Checking in...' : data.checkInWindow.isOpen ? 'Confirm attendance' : 'Check-in is not open'} <Check size={16} /></button>}
      <button className="button button-outline" type="button" onClick={() => navigate('/my-activities')}>Return to My Activities</button>
    </section>}
  </main>;
}

function formatProblems(problems = []) {
  return problems.map(({ title, url, difficulty = 'medium' }) => `${title} | ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} | ${url}`).join('\n');
}

function parseProblems(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length >= 3) {
      const difficulty = parts[1].toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new Error(`"${parts[1]}" is not a valid difficulty. Use Easy, Medium, or Hard.`);
      }
      const [problem] = parseResources(`${parts[0]} | ${parts.slice(2).join('|')}`);
      return { ...problem, difficulty };
    }
    if (parts.length === 2 && ['easy', 'medium', 'hard'].includes(parts[1].toLowerCase())) {
      throw new Error(`Add a URL after the difficulty for "${parts[0]}".`);
    }
    const [problem] = parseResources(line);
    return { ...problem, difficulty: 'medium' };
  });
}

function emptyCycleForm(timeZone) {
  return {
    order: 1, title: '', description: '', location: '', difficulty: 'beginner', objectives: '',
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
    location: form.location,
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
    let title;
    let url;
    if (separator > 0) {
      title = line.slice(0, separator).trim();
      url = line.slice(separator + 1).trim();
    } else {
      const linkStart = line.search(/https?:\/\//i);
      if (linkStart < 0) {
        throw new Error('Enter a URL per line, or use: title | https://example.com');
      }
      title = line.slice(0, linkStart).trim();
      url = line.slice(linkStart).trim();
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`"${url}" is not a valid link. Include https:// or http://.`);
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      throw new Error(`"${url}" must be a public HTTP or HTTPS link.`);
    }
    if (!title) {
      title = parsedUrl.hostname.replace(/^www\./i, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    return { title, url: parsedUrl.toString() };
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
      <label>Learning materials <small>One URL per line, or title | https://...</small><textarea rows="3" value={form.materials} onChange={(event) => setForm({ ...form, materials: event.target.value })} /></label>
      <label>Problem sets <small>One URL per line, or title | https://...</small><textarea rows="3" value={form.problemSets} onChange={(event) => setForm({ ...form, problemSets: event.target.value })} /></label>
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

export function AdminCyclesPage({ token }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapId, setRoadmapId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/admin/roadmaps', { token });
      setRoadmaps(result.roadmaps);
      setRoadmapId((current) => current || result.roadmaps[0]?._id || '');
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => { loadRoadmaps(); }, [loadRoadmaps]);

  const cycles = roadmaps.flatMap((roadmap) => (roadmap.cycles || []).map((cycle) => ({ ...cycle, roadmap })));
  const filteredCycles = cycles.filter((cycle) => {
    const matchesQuery = `${cycle.title} ${cycle.roadmap.title}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === 'all' || cycle.status === status);
  });

  return <main className="page-wrap admin-cycles-page">
    <div className="page-heading roadmap-studio-heading">
      <div><h1>Training cycles</h1></div>
      <div className="admin-cycle-create">
        <label htmlFor="admin-cycle-roadmap">Create cycle for</label>
        <select id="admin-cycle-roadmap" value={roadmapId} onChange={(event) => setRoadmapId(event.target.value)} disabled={!roadmaps.length}>
          {!roadmaps.length && <option value="">No roadmaps available</option>}
          {roadmaps.map((roadmap) => <option key={roadmap._id} value={roadmap._id}>{roadmap.title}</option>)}
        </select>
        {roadmapId && <Link className="button button-dark" to={`/admin/roadmaps/${roadmapId}/cycles/new`}><Plus size={16} /> Create cycle</Link>}
      </div>
    </div>
    {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={loadRoadmaps}>Try again</button></div>}
    <div className="roadmap-studio-filters admin-cycle-filters">
      <label>Search cycles<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cycle or roadmap title" /></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
    </div>
    {loading ? <LoadingState>Loading training cycles...</LoadingState> : filteredCycles.length ? <div className="admin-cycle-list">
      {filteredCycles.map((cycle) => <article className="admin-cycle-row" key={cycle._id}>
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

export function AdminRoadmapsPage({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeParts = location.pathname.split('/').filter(Boolean).slice(2);
  const routeRoadmapId = routeParts[0] && routeParts[0] !== 'new' ? routeParts[0] : '';
  const routeSection = routeParts[0] === 'new'
    ? 'create-roadmap'
    : !routeRoadmapId
      ? 'list'
      : routeParts[1] === 'settings'
        ? 'settings'
        : routeParts[1] === 'nodes'
          ? 'nodes'
        : routeParts[1] === 'cycles'
          ? routeParts[2] === 'new' || routeParts[3] === 'edit'
            ? 'cycle-form'
            : routeParts[3] === 'sessions'
              ? 'sessions'
              : 'cycles'
          : 'overview';
  const routeCycleId = routeParts[1] === 'cycles' && routeParts[2] !== 'new' ? routeParts[2] || '' : '';
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapForm, setRoadmapForm] = useState({ title: '', description: '', coverImageUrl: '', difficulty: 'beginner', estimatedDuration: '', objectives: '', audience: '', prerequisites: '', status: 'draft' });
  const [selectedRoadmapForm, setSelectedRoadmapForm] = useState(null);
  const [cycleForm, setCycleForm] = useState(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
  const [selectedRoadmap, setSelectedRoadmap] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [sessions, setSessions] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [nodeForm, setNodeForm] = useState({ title: '', description: '', dependencies: [], position: 0, estimatedHours: '', isRequired: true, resources: '', problems: '' });
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
      const result = await api('/admin/roadmaps', { token });
      setRoadmaps(result.roadmaps);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { loadRoadmaps(); }, [loadRoadmaps]);

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
    if (!selectedCycle) { setSessions([]); setEnrolledStudents([]); return; }
    setSessionsLoading(true);
    try {
      const [sessionResult, enrollmentResult] = await Promise.all([
        api(`/admin/roadmap-cycles/${selectedCycle}/sessions`, { token }),
        api(`/admin/roadmap-cycles/${selectedCycle}/enrollments`, { token }),
      ]);
      setSessions(sessionResult.sessions);
      setEnrolledStudents(enrollmentResult.enrollments);
    } catch (reason) { setError(reason.message); }
    finally { setSessionsLoading(false); }
  }, [selectedCycle, token]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadNodes = useCallback(async () => {
    if (!routeRoadmapId || routeSection !== 'nodes') { setNodes([]); return; }
    setNodesLoading(true);
    try {
      const result = await api(`/admin/roadmaps/${routeRoadmapId}/nodes`, { token });
      setNodes(result.nodes);
      setError('');
    } catch (reason) { setError(reason.message); }
    finally { setNodesLoading(false); }
  }, [routeRoadmapId, routeSection, token]);
  useEffect(() => { loadNodes(); }, [loadNodes]);

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
      difficulty: selected.difficulty || 'beginner',
      estimatedDuration: selected.estimatedDuration || '',
      objectives: (selected.objectives || []).join('\n'),
      audience: selected.audience || '',
      prerequisites: selected.prerequisites || '',
    });
  }, [selected]);
  useEffect(() => {
    if (routeSection !== 'cycle-form' || !routeCycleId || !selected) return;
    const cycle = selected.cycles.find((item) => item._id === routeCycleId);
    if (!cycle || editingCycleId === cycle._id) return;
    setEditingCycleId(cycle._id);
    setCycleForm({
      ...cycle,
      objectives: (cycle.objectives || []).join('\n'),
      registrationOpensAt: new Date(new Date(cycle.registrationOpensAt).getTime() - new Date(cycle.registrationOpensAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      registrationClosesAt: new Date(new Date(cycle.registrationClosesAt).getTime() - new Date(cycle.registrationClosesAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      capacity: cycle.capacity ?? '',
    });
  }, [editingCycleId, routeCycleId, routeSection, selected]);
  const saveRoadmap = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/admin/roadmaps', { method: 'POST', token, body: JSON.stringify({ ...roadmapForm, objectives: roadmapForm.objectives.split('\n').map((item) => item.trim()).filter(Boolean) }) });
      setRoadmapForm({ title: '', description: '', coverImageUrl: '', difficulty: 'beginner', estimatedDuration: '', objectives: '', audience: '', prerequisites: '', status: 'draft' });
      setMessage('Roadmap created.');
      await loadRoadmaps();
      navigate('/admin/roadmaps');
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
  const editNode = (node) => {
    setEditingNodeId(node._id);
    setNodeForm({
      title: node.title,
      description: node.description || '',
      dependencies: (node.dependencies || []).map(String),
      position: node.position ?? 0,
      estimatedHours: node.estimatedHours ?? '',
      isRequired: node.isRequired !== false,
      resources: formatResources(node.resources || []),
      problems: formatProblems(node.problems || []),
    });
  };
  const resetNodeForm = () => {
    setEditingNodeId('');
    setNodeForm({ title: '', description: '', dependencies: [], position: nodes.length, estimatedHours: '', isRequired: true, resources: '', problems: '' });
  };
  const saveNode = async (event) => {
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
        problems: parseProblems(nodeForm.problems),
      };
      await api(`/admin/roadmaps/${selected._id}/nodes${editingNodeId ? `/${editingNodeId}` : ''}`, {
        method: editingNodeId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload),
      });
      setMessage(editingNodeId ? 'Learning topic updated.' : 'Learning topic added.');
      resetNodeForm();
      await loadNodes();
    } catch (reason) { setError(reason.message); }
    finally { setNodeSaving(false); }
  };
  const removeNode = async (node) => {
    if (!selected || !window.confirm(`Delete "${node.title}"? Topics depending on it will remain and their prerequisite link will be removed.`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/admin/roadmaps/${selected._id}/nodes/${node._id}`, { method: 'DELETE', token });
      if (editingNodeId === node._id) resetNodeForm();
      setMessage('Learning topic deleted.');
      await loadNodes();
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
  const archiveRoadmap = async (event) => {
    event.preventDefault();
    if (!archiveTarget || archiveConfirmation !== archiveTarget.title) return;
    setBusy(true);
    setArchiveError('');
    try {
      await api(`/admin/roadmaps/${archiveTarget._id}`, { method: 'PUT', token, body: JSON.stringify({ status: 'archived' }) });
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
  const requestArchive = (roadmap) => {
    setArchiveError('');
    setArchiveConfirmation('');
    setArchiveTarget(roadmap);
  };
  const archiveCycle = async (event) => {
    event.preventDefault();
    if (!cycleArchiveTarget || cycleArchiveConfirmation !== cycleArchiveTarget.title) return;
    setBusy(true);
    setCycleArchiveError('');
    try {
      await api(`/admin/roadmap-cycles/${cycleArchiveTarget._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ status: 'archived' }),
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
  const requestCycleArchive = (cycle) => {
    setCycleArchiveError('');
    setCycleArchiveConfirmation('');
    setCycleArchiveTarget(cycle);
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
    setPreview(null);
    navigate(`/admin/roadmaps/${selectedRoadmap}/cycles/${cycle._id}/edit`);
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
      navigate(`/admin/roadmaps/${selectedRoadmap}/cycles`);
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

  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const matchesSearch = `${roadmap.title} ${roadmap.audience || ''}`.toLowerCase().includes(roadmapSearch.toLowerCase());
    return matchesSearch && (roadmapStatusFilter === 'all' || roadmap.status === roadmapStatusFilter);
  });
  const eligibleDependencyNodes = useMemo(() => {
    if (!editingNodeId) return { options: nodes, cycleIds: new Set(), missingIds: [] };
    const childrenByDependency = new Map(nodes.map((node) => [String(node._id), []]));
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
    const options = nodes.filter((node) => {
      const id = String(node._id);
      return !descendants.has(id) || nodeForm.dependencies.includes(id);
    });
    const knownIds = new Set(nodes.map(({ _id }) => String(_id)));
    const missingIds = nodeForm.dependencies.filter((id) => !knownIds.has(id));
    return { options, cycleIds: descendants, missingIds };
  }, [editingNodeId, nodeForm.dependencies, nodes]);
  const pageTitle = routeSection === 'list' ? 'Roadmaps' : routeSection === 'create-roadmap' ? 'Create roadmap'
    : routeSection === 'cycle-form' ? `${editingCycleId ? 'Edit' : 'Create'} cycle`
      : routeSection === 'sessions' ? 'Session management' : selected?.title || 'Roadmap';

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
      {routeSection === 'list' && <button className="button button-dark" type="button" onClick={() => { setError(''); setMessage(''); setRoadmapForm({ title: '', description: '', coverImageUrl: '', difficulty: 'beginner', estimatedDuration: '', objectives: '', audience: '', prerequisites: '', status: 'draft' }); navigate('/admin/roadmaps/new'); }}><Plus size={16} /> Create roadmap</button>}
      {routeSection === 'cycles' && selected?.status !== 'archived' && <button className="button button-dark" type="button" onClick={() => { setEditingCycleId(''); setCycleForm(emptyCycleForm(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')); setError(''); setMessage(''); navigate(`/admin/roadmaps/${selectedRoadmap}/cycles/new`); }}><Plus size={16} /> Create cycle</button>}
    </div>

    {routeSection === 'list' && <>
      {error && <div className="notice error-notice" role="alert">{error} <button className="text-link" type="button" onClick={loadRoadmaps}>Try again</button></div>}
      {message && <div className="notice success-notice" role="status">{message}</div>}
      <div className="roadmap-studio-filters">
        <label>Search roadmaps<input type="search" value={roadmapSearch} onChange={(event) => setRoadmapSearch(event.target.value)} placeholder="Title or audience" /></label>
        <label>Status<select value={roadmapStatusFilter} onChange={(event) => setRoadmapStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
      </div>
      {loading ? <LoadingState>Loading roadmaps...</LoadingState> : filteredRoadmaps.length ? <div className="roadmap-studio-list">
        {filteredRoadmaps.map((roadmap) => <article className="roadmap-studio-row" key={roadmap._id}>
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
        <label>Title<input maxLength="140" required value={roadmapForm.title} onChange={(event) => setRoadmapForm({ ...roadmapForm, title: event.target.value })} /></label>
        <label>Description<textarea rows="3" maxLength="5000" required value={roadmapForm.description} onChange={(event) => setRoadmapForm({ ...roadmapForm, description: event.target.value })} /></label>
        <label>Cover image URL (optional)<input type="url" maxLength="500" value={roadmapForm.coverImageUrl} onChange={(event) => setRoadmapForm({ ...roadmapForm, coverImageUrl: event.target.value })} /></label>
        <label>Difficulty<select value={roadmapForm.difficulty} onChange={(event) => setRoadmapForm({ ...roadmapForm, difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
        <label>Estimated duration (optional)<input maxLength="80" placeholder="e.g. 8 weeks" value={roadmapForm.estimatedDuration} onChange={(event) => setRoadmapForm({ ...roadmapForm, estimatedDuration: event.target.value })} /></label>
        <label>Learning objectives <small>One per line</small><textarea rows="3" value={roadmapForm.objectives} onChange={(event) => setRoadmapForm({ ...roadmapForm, objectives: event.target.value })} /></label>
        <label>Expected audience<input value={roadmapForm.audience} onChange={(event) => setRoadmapForm({ ...roadmapForm, audience: event.target.value })} /></label>
        <label>Prerequisites<input value={roadmapForm.prerequisites} onChange={(event) => setRoadmapForm({ ...roadmapForm, prerequisites: event.target.value })} /></label>
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
          <label>Title<input maxLength="140" required value={selectedRoadmapForm.title} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, title: event.target.value })} /></label>
          <label>Description<textarea rows="3" maxLength="5000" required value={selectedRoadmapForm.description} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, description: event.target.value })} /></label>
          <label>Cover image URL (optional)<input type="url" maxLength="500" value={selectedRoadmapForm.coverImageUrl} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, coverImageUrl: event.target.value })} /></label>
          <label>Difficulty<select value={selectedRoadmapForm.difficulty} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>Estimated duration (optional)<input maxLength="80" placeholder="e.g. 8 weeks" value={selectedRoadmapForm.estimatedDuration} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, estimatedDuration: event.target.value })} /></label>
          <label>Learning objectives <small>One per line</small><textarea rows="3" value={selectedRoadmapForm.objectives} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, objectives: event.target.value })} /></label>
          <label>Expected audience<input value={selectedRoadmapForm.audience} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, audience: event.target.value })} /></label>
          <label>Prerequisites<input value={selectedRoadmapForm.prerequisites} onChange={(event) => setSelectedRoadmapForm({ ...selectedRoadmapForm, prerequisites: event.target.value })} /></label>
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
            <label>Topic title<input required maxLength="140" value={nodeForm.title} onChange={(event) => setNodeForm({ ...nodeForm, title: event.target.value })} /></label>
            <label>Description<textarea rows="3" maxLength="3000" value={nodeForm.description} onChange={(event) => setNodeForm({ ...nodeForm, description: event.target.value })} /></label>
            <div className="roadmap-node-dependencies">
              <div className="roadmap-node-dependencies-heading"><strong>Prerequisites</strong><small>Click topic names to select one or more. Leave all unselected for a root topic.</small></div>
              <div className="roadmap-node-dependency-options" role="group" aria-label="Select prerequisite topics">
                {eligibleDependencyNodes.options.map((node) => {
                  const id = String(node._id);
                  const selected = nodeForm.dependencies.includes(id);
                  const invalidExistingLink = selected && eligibleDependencyNodes.cycleIds.has(id);
                  return <button
                    className={`roadmap-node-dependency-option${selected ? ' selected' : ''}${invalidExistingLink ? ' invalid' : ''}`}
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setNodeForm((current) => {
                      const currentlySelected = current.dependencies.includes(id);
                      return {
                        ...current,
                        dependencies: currentlySelected
                          ? current.dependencies.filter((dependency) => dependency !== id)
                          : [...current.dependencies, id],
                      };
                    })}
                  >
                    <span>{node.title}{invalidExistingLink && <small>Existing link creates a circular path · click to remove</small>}</span>
                    {selected && <Check size={16} aria-hidden="true" />}
                  </button>;
                })}
                {eligibleDependencyNodes.missingIds.map((id) => <button
                  className="roadmap-node-dependency-option selected invalid"
                  key={id}
                  type="button"
                  aria-pressed="true"
                  onClick={() => setNodeForm((current) => ({ ...current, dependencies: current.dependencies.filter((dependency) => dependency !== id) }))}
                >
                  <span>Unavailable topic<small>Click to remove this prerequisite</small></span><Check size={16} aria-hidden="true" />
                </button>)}
                {!eligibleDependencyNodes.options.length && !eligibleDependencyNodes.missingIds.length && <p className="roadmap-node-dependency-empty">Add another topic first to choose a prerequisite.</p>}
              </div>
            </div>
            <div className="roadmap-node-form-row">
              <label>Order<input type="number" min="0" step="1" required value={nodeForm.position} onChange={(event) => setNodeForm({ ...nodeForm, position: event.target.value })} /></label>
              <label>Estimated hours<input type="number" min="0" step="0.5" value={nodeForm.estimatedHours} onChange={(event) => setNodeForm({ ...nodeForm, estimatedHours: event.target.value })} /></label>
              <label className="roadmap-node-required"><input type="checkbox" checked={nodeForm.isRequired} onChange={(event) => setNodeForm({ ...nodeForm, isRequired: event.target.checked })} /> Required topic</label>
            </div>
            <label>Learning resources <small>One URL per line, or title | https://example.com</small><textarea rows="3" value={nodeForm.resources} onChange={(event) => setNodeForm({ ...nodeForm, resources: event.target.value })} /></label>
            <label>Programming problems <small>One per line: title | Easy, Medium, or Hard | https://example.com. Older title | URL and URL-only lines default to Medium.</small><textarea rows="5" value={nodeForm.problems} onChange={(event) => setNodeForm({ ...nodeForm, problems: event.target.value })} /></label>
            <div className="roadmap-admin-actions"><button className="button button-dark" disabled={nodeSaving}><Save size={15} /> {nodeSaving ? 'Saving topic...' : editingNodeId ? 'Save topic' : 'Add topic'}</button>{editingNodeId && <button className="button button-outline" type="button" disabled={nodeSaving} onClick={resetNodeForm}>Cancel edit</button>}</div>
          </form>
          <div className="learning-path-admin-preview">
            <h3>Path preview</h3>
            {nodes.length > 0 && <LearningPath nodes={nodes} />}
            {nodesLoading ? <LoadingState>Loading topics...</LoadingState> : nodes.length ? nodes.map((node) => <article className="learning-path-admin-node" key={node._id}>
              <div><span className="category-label">{node.isRequired ? 'Required' : 'Optional'} · Order {node.position}</span><h4>{node.title}</h4>
                {(node.dependencies || []).length > 0 && <p>Prerequisites: {node.dependencies.map((id) => nodes.find((item) => item._id === String(id))?.title).filter(Boolean).join(', ') || 'None'}</p>}
              </div><div className="roadmap-admin-actions"><button className="button button-outline" type="button" onClick={() => editNode(node)}>Edit</button><button className="button button-outline roadmap-archive-button" type="button" disabled={busy} onClick={() => removeNode(node)}>Delete</button></div>
            </article>) : <div className="empty-state"><p>Add topics to preview the learning path here.</p></div>}
          </div>
        </>}
      </section>}

      {routeSection === 'cycles' && <section className="roadmap-admin-panel">
        <div className="roadmap-studio-section-heading"><div><h2>Cycles</h2></div></div>
        {selected.cycles?.length ? <div className="roadmap-studio-cycle-list">{selected.cycles.map((cycle) => <article className="roadmap-studio-cycle-row" key={cycle._id}>
          <div className="roadmap-studio-cycle-order">{cycle.order}</div>
          <div className="roadmap-studio-cycle-copy"><span className={`roadmap-studio-status status-${cycle.status}`}>{cycle.difficulty} · {cycle.status}</span><h3>{cycle.title}</h3><p>{cycle.startDate} – {cycle.endDate} · {cycle.sessionsPerWeek} sessions / week · {cycle.enrollmentCount}{cycle.capacity ? `/${cycle.capacity}` : ''} enrolled</p></div>
          <div className="roadmap-admin-actions">{cycle.status !== 'archived' && <><button type="button" className="button button-outline" onClick={() => editCycle(cycle)}>Edit cycle</button><button type="button" className="button button-outline roadmap-archive-button" disabled={busy} onClick={() => requestCycleArchive(cycle)}>Archive cycle</button></>}<Link className="button button-dark" to={`/admin/roadmaps/${selected._id}/cycles/${cycle._id}/sessions`}>Manage sessions</Link></div>
        </article>)}</div> : <div className="empty-state"><h3>No cycles yet.</h3><p>Create a cycle to define its schedule and student registration window.</p></div>}
      </section>}

      {routeSection === 'cycle-form' && routeCycleId && !selected.cycles.some((cycle) => cycle._id === routeCycleId) && <div className="notice error-notice" role="alert">Cycle not found. <Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Return to cycles</Link></div>}
      {routeSection === 'cycle-form' && selected.status !== 'archived' && (!routeCycleId || editingCycleId === routeCycleId) && <section className="roadmap-admin-panel">
        <h2>{editingCycleId ? 'Edit cycle settings' : 'Create cycle'}</h2>
        <form className="roadmap-admin-form roadmap-cycle-form" onSubmit={saveCycle}>
          <fieldset className="roadmap-form-group"><legend>Basic information</legend>
            <label>Order<input type="number" min="1" required value={cycleForm.order} onChange={(event) => setCycleForm({ ...cycleForm, order: event.target.value })} /></label>
            <label>Cycle title<input maxLength="120" required value={cycleForm.title} onChange={(event) => setCycleForm({ ...cycleForm, title: event.target.value })} /></label>
            <label>Description<textarea rows="3" required value={cycleForm.description} onChange={(event) => setCycleForm({ ...cycleForm, description: event.target.value })} /></label>
            <label>Location (optional)<input maxLength="200" value={cycleForm.location || ''} onChange={(event) => setCycleForm({ ...cycleForm, location: event.target.value })} placeholder="Campus, room, or online venue" /></label>
            <label>Difficulty<select value={cycleForm.difficulty} onChange={(event) => setCycleForm({ ...cycleForm, difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label>Objectives <small>One per line</small><textarea rows="3" value={cycleForm.objectives} onChange={(event) => setCycleForm({ ...cycleForm, objectives: event.target.value })} /></label>
            <label>Prerequisites<input value={cycleForm.prerequisites} onChange={(event) => setCycleForm({ ...cycleForm, prerequisites: event.target.value })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Schedule configuration</legend>
            <label>Cycle start date<input type="date" required value={cycleForm.startDate} onChange={(event) => setCycleForm({ ...cycleForm, startDate: event.target.value })} /></label>
            <label>Cycle end date<input type="date" required value={cycleForm.endDate} onChange={(event) => setCycleForm({ ...cycleForm, endDate: event.target.value })} /></label>
            <label>Sessions per week<input type="number" min="1" max="7" required value={cycleForm.sessionsPerWeek} onChange={(event) => setCycleForm({ ...cycleForm, sessionsPerWeek: event.target.value })} /></label>
            <fieldset className="roadmap-weekdays"><legend>Training days (must match weekly frequency)</legend>{weekdays.map(([day, value]) => <label key={day}><input type="checkbox" checked={cycleForm.trainingDays.includes(value)} onChange={(event) => setCycleForm({ ...cycleForm, trainingDays: event.target.checked ? [...cycleForm.trainingDays, value] : cycleForm.trainingDays.filter((item) => item !== value) })} /> {day}</label>)}</fieldset>
            <label>Local start time<input type="time" required value={cycleForm.startTime} onChange={(event) => setCycleForm({ ...cycleForm, startTime: event.target.value })} /></label>
            <label>Duration (minutes)<input type="number" min="15" max="600" required value={cycleForm.sessionDurationMinutes} onChange={(event) => setCycleForm({ ...cycleForm, sessionDurationMinutes: event.target.value })} /></label>
            <label>Time zone (IANA)<input required maxLength="80" placeholder="Africa/Cairo" value={cycleForm.timeZone} onChange={(event) => setCycleForm({ ...cycleForm, timeZone: event.target.value })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Registration</legend>
            <label>Registration opens<input type="datetime-local" required value={cycleForm.registrationOpensAt} onChange={(event) => setCycleForm({ ...cycleForm, registrationOpensAt: event.target.value })} /></label>
            <label>Registration closes<input type="datetime-local" required value={cycleForm.registrationClosesAt} onChange={(event) => setCycleForm({ ...cycleForm, registrationClosesAt: event.target.value })} /></label>
            <label>Capacity (optional)<input type="number" min="1" value={cycleForm.capacity} onChange={(event) => setCycleForm({ ...cycleForm, capacity: event.target.value })} /></label>
          </fieldset>
          <fieldset className="roadmap-form-group"><legend>Points and status</legend>
            <label>Points per attended session<input type="number" min="0" step="any" value={cycleForm.attendancePoints} onChange={(event) => setCycleForm({ ...cycleForm, attendancePoints: event.target.value })} /></label>
            <label>Cycle status<select value={cycleForm.status} onChange={(event) => setCycleForm({ ...cycleForm, status: event.target.value })}><option value="draft">Draft</option><option value="published" disabled={selected.status !== 'published'}>Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
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
          <p><strong>Weekly schedule</strong><span>{selectedCycleInfo.sessionsPerWeek} sessions · {(selectedCycleInfo.trainingDays || []).map((day) => weekdays.find((item) => item[1] === day)?.[0]).filter(Boolean).join(', ')}</span></p>
          <p><strong>Local session time</strong><span>{selectedCycleInfo.startTime} · {selectedCycleInfo.timeZone}</span></p>
          {selectedCycleInfo.location && <p><strong>Location</strong><span>{selectedCycleInfo.location}</span></p>}
          <p><strong>Enrollment</strong><span>{enrolledStudents.length} students{selectedCycleInfo.capacity ? ` · capacity ${selectedCycleInfo.capacity}` : ''}</span></p>
        </div>
        <section className="roadmap-studio-schedule">
          <div className="roadmap-studio-section-heading"><div><h3>Schedule generation</h3><p>Preview changes first; applying is a separate confirmed action.</p></div><div className="roadmap-admin-actions"><button type="button" className="button button-outline" disabled={busy} onClick={loadPreview}>{busy ? 'Working...' : 'Preview schedule'}</button>{preview && <button type="button" className="button button-dark" disabled={busy} onClick={confirmSchedule}>Apply schedule</button>}</div></div>
          {preview && <div className="roadmap-schedule-preview"><p>{preview.proposedCount} proposed sessions · {preview.additions} new · {preview.reschedules} rescheduled · {preview.cancellations} cancelled · {preview.preserved} preserved</p><div className="roadmap-preview-list">{preview.changes.map((change) => <span key={`${change.ordinal}-${change.action}`}>{change.action}: Session {change.ordinal} · {change.startsAt ? formatSessionTime({ startsAt: change.startsAt, timeZone: selectedCycleInfo.timeZone }) : '—'}</span>)}</div></div>}
        </section>
        <section className="roadmap-studio-students"><h3>Enrolled students <span>{enrolledStudents.length}</span></h3>{enrolledStudents.length ? <div className="roadmap-studio-student-list">{enrolledStudents.map(({ _id, student }) => student && <span key={_id}>{student.name} · {student.username || student.email}</span>)}</div> : <p>No students enrolled in this cycle yet.</p>}</section>
        <section className="roadmap-studio-session-section"><h3>Sessions <span>{sessions.length}</span></h3>
          {sessionsLoading ? <LoadingState>Loading sessions...</LoadingState> : sessions.length ? <div className="roadmap-admin-session-list">{sessions.map((session) => <AdminSession key={session._id} token={token} session={session} students={enrolledStudents} refresh={loadSessions} />)}</div> : <p>No sessions have been generated for this cycle yet. Preview and apply the schedule to create sessions.</p>}
        </section>
      </section>}
      {routeSection === 'sessions' && !selectedCycleInfo && <div className="notice error-notice" role="alert">Cycle not found in this roadmap. <Link to={`/admin/roadmaps/${selectedRoadmap}/cycles`}>Return to cycles</Link></div>}
      {loading && <LoadingState>Loading roadmap administration...</LoadingState>}
    </>}
    {archiveTarget && <div className="roadmap-archive-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setArchiveTarget(null); }}>
      <form className="roadmap-archive-dialog" role="dialog" aria-modal="true" aria-labelledby="roadmap-archive-title" onSubmit={archiveRoadmap}>
        <button className="roadmap-archive-close" type="button" aria-label="Cancel archive" disabled={busy} onClick={() => setArchiveTarget(null)}><X size={20} /></button>
        <span className="eyebrow">CONFIRM ROADMAP ARCHIVE</span>
        <h2 id="roadmap-archive-title">Archive this roadmap?</h2>
        <p>Archiving <strong>{archiveTarget.title}</strong> hides it from active learning paths. Its cycles and existing records are preserved.</p>
        <label htmlFor="roadmap-archive-confirmation">Type the roadmap name to continue</label>
        <input id="roadmap-archive-confirmation" autoComplete="off" value={archiveConfirmation} onChange={(event) => setArchiveConfirmation(event.target.value)} placeholder={archiveTarget.title} required />
        {archiveError && <div className="notice error-notice" role="alert">{archiveError}</div>}
        <div className="roadmap-archive-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={() => setArchiveTarget(null)}>Cancel</button>
          <button type="submit" className="button roadmap-archive-confirm" disabled={busy || archiveConfirmation !== archiveTarget.title}>{busy ? 'Archiving...' : 'Archive roadmap'}</button>
        </div>
      </form>
    </div>}
    {cycleArchiveTarget && <div className="roadmap-archive-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCycleArchiveTarget(null); }}>
      <form className="roadmap-archive-dialog" role="dialog" aria-modal="true" aria-labelledby="cycle-archive-title" onSubmit={archiveCycle}>
        <button className="roadmap-archive-close" type="button" aria-label="Cancel cycle archive" disabled={busy} onClick={() => setCycleArchiveTarget(null)}><X size={20} /></button>
        <span className="eyebrow">CONFIRM CYCLE ARCHIVE</span>
        <h2 id="cycle-archive-title">Archive this cycle?</h2>
        <p>Archiving <strong>{cycleArchiveTarget.title}</strong> closes it to new registrations and removes it from cycle listings. Existing enrollments, sessions, and attendance remain preserved.</p>
        <label htmlFor="cycle-archive-confirmation">Type the cycle name to continue</label>
        <input id="cycle-archive-confirmation" autoComplete="off" value={cycleArchiveConfirmation} onChange={(event) => setCycleArchiveConfirmation(event.target.value)} placeholder={cycleArchiveTarget.title} required />
        {cycleArchiveError && <div className="notice error-notice" role="alert">{cycleArchiveError}</div>}
        <div className="roadmap-archive-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={() => setCycleArchiveTarget(null)}>Cancel</button>
          <button type="submit" className="button roadmap-archive-confirm" disabled={busy || cycleArchiveConfirmation !== cycleArchiveTarget.title}>{busy ? 'Archiving...' : 'Archive cycle'}</button>
        </div>
      </form>
    </div>}
  </main>;
}
