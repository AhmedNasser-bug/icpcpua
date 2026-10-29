import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { api } from "../../../shared/services/api.js";
import { weekdays, sessionDateKey, formatCalendarMonth, formatCalendarDay, problemProgressKey, clampGraphView } from '../utils/roadmapUtils.js';
export function LearningPath({
  nodes = [],
  token,
  user,
  roadmapSlug
}) {
  const viewportRef = useRef(null);
  const dialogCloseRef = useRef(null);
  const activePointers = useRef(new Map());
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [selectedId, setSelectedId] = useState('');
  const [isPanning, setIsPanning] = useState(false);
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0
  });
  const [view, setView] = useState({
    x: 0,
    y: 0,
    zoom: 1
  });
  const [solvedKeys, setSolvedKeys] = useState(() => new Set());
  const [progressStatus, setProgressStatus] = useState(user?.role === 'user' && token ? 'loading' : 'unavailable');
  const [progressError, setProgressError] = useState('');
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const [progressRetry, setProgressRetry] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => sessionDateKey({
    startsAt: new Date()
  }));
  const [roadmapSessions, setRoadmapSessions] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState(user?.role === 'user' && token ? 'loading' : 'unavailable');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleRetry, setScheduleRetry] = useState(0);
  const graph = useMemo(() => {
    const nodeById = new Map(nodes.map(node => [String(node._id), node]));
    const levels = new Map();
    const pending = [...nodes].sort((left, right) => left.position - right.position || left.title.localeCompare(right.title));
    while (pending.length) {
      const ready = pending.filter(node => (node.dependencies || []).every(dependency => !nodeById.has(String(dependency)) || levels.has(String(dependency))));
      const current = ready.length ? ready : pending;
      for (const node of current) {
        const dependencies = (node.dependencies || []).map(String).filter(dependency => nodeById.has(dependency));
        const level = dependencies.length ? Math.max(...dependencies.map(dependency => levels.get(dependency) || 0)) + 1 : 0;
        levels.set(String(node._id), level);
        pending.splice(pending.indexOf(node), 1);
      }
    }
    const grouped = [...levels.entries()].reduce((groups, [id, level]) => {
      groups[level] ||= [];
      groups[level].push(nodeById.get(id));
      return groups;
    }, []).map(level => level.sort((left, right) => left.position - right.position || left.title.localeCompare(right.title)));
    const nodeWidth = 260;
    const nodeHeight = 82;
    const horizontalGap = 66;
    const verticalGap = 82;
    const padding = 44;
    const widestLevel = Math.max(1, ...grouped.map(level => level.length));
    const width = padding * 2 + widestLevel * nodeWidth + Math.max(0, widestLevel - 1) * horizontalGap;
    const height = padding * 2 + grouped.length * (nodeHeight + verticalGap) - verticalGap;
    const positions = new Map();
    grouped.forEach((level, row) => {
      const rowWidth = level.length * nodeWidth + Math.max(0, level.length - 1) * horizontalGap;
      const startX = (width - rowWidth) / 2;
      level.forEach((node, column) => positions.set(String(node._id), {
        x: startX + column * (nodeWidth + horizontalGap),
        y: padding + row * (nodeHeight + verticalGap)
      }));
    });
    const edges = nodes.flatMap(node => (node.dependencies || []).map(String).filter(dependency => positions.has(dependency) && positions.has(String(node._id))).map(dependency => {
      const from = positions.get(dependency);
      const to = positions.get(String(node._id));
      const startX = from.x + nodeWidth / 2;
      const startY = from.y + nodeHeight;
      const endX = to.x + nodeWidth / 2;
      const endY = to.y;
      const curve = Math.max(30, (endY - startY) / 2);
      return {
        id: `${dependency}-${node._id}`,
        path: `M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}`
      };
    }));
    const layoutKey = JSON.stringify(nodes.map(node => [String(node._id), node.title, node.position, (node.dependencies || []).map(String)]));
    return {
      nodeById,
      positions,
      edges,
      width,
      height,
      nodeWidth,
      nodeHeight,
      layoutKey
    };
  }, [nodes]);
  const problemCounts = useMemo(() => {
    const counts = {
      total: 0,
      solved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0
    };
    const byTopic = new Map();
    for (const node of nodes) {
      const topic = {
        total: 0,
        solved: 0
      };
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
    return {
      ...counts,
      byTopic
    };
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
      y: (viewport.height - graph.height * zoom) / 2
    }, viewport, graph));
  }, [graph, viewport]);
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setViewport({
      width: entry.contentRect.width,
      height: entry.contentRect.height
    }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const onWheel = useCallback(event => {
    const element = viewportRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    changeZoom(view.zoom * factor, event.clientX - bounds.left, event.clientY - bounds.top);
  }, [graph, viewport, view.zoom]);
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    element.addEventListener('wheel', onWheel, {
      passive: false
    });
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
      return () => {
        active = false;
      };
    }
    setProgressStatus('loading');
    api(`/roadmaps/${encodeURIComponent(roadmapSlug)}/progress`, {
      token
    }).then(({
      solvedProblems
    }) => {
      if (active) {
        setSolvedKeys(new Set(solvedProblems.map(({
          nodeId,
          problemUrl
        }) => problemProgressKey(nodeId, problemUrl))));
        setProgressStatus('ready');
      }
    }).catch(reason => {
      if (active) {
        setProgressError(reason.message);
        setProgressStatus('error');
      }
    });
    return () => {
      active = false;
    };
  }, [roadmapSlug, token, user?.role, progressRetry]);
  useEffect(() => {
    let active = true;
    setRoadmapSessions([]);
    setScheduleError('');
    if (!token || user?.role !== 'user') {
      setScheduleStatus('unavailable');
      return () => {
        active = false;
      };
    }
    setScheduleStatus('loading');
    api('/roadmaps/my', {
      token
    }).then(({
      roadmaps = []
    }) => {
      if (!active) return;
      const sessions = roadmaps.filter(item => item.roadmap?.slug === roadmapSlug).flatMap(({
        cycle
      }) => (cycle?.sessions || []).map(session => ({
        ...session,
        cycleId: cycle._id,
        cycleTitle: cycle.title,
        timeZone: session.timeZone || cycle.timeZone || 'UTC'
      }))).sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
      setRoadmapSessions(sessions);
      setScheduleStatus('ready');
    }).catch(reason => {
      if (active) {
        setScheduleError(reason.message);
        setScheduleStatus('error');
      }
    });
    return () => {
      active = false;
    };
  }, [roadmapSlug, scheduleRetry, token, user?.role]);
  const calendarYear = calendarMonth.getUTCFullYear();
  const calendarMonthIndex = calendarMonth.getUTCMonth();
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + 1, 0)).getUTCDate();
    const leadingDays = new Date(Date.UTC(calendarYear, calendarMonthIndex, 1)).getUTCDay();
    return Array.from({
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
  }, [calendarMonthIndex, calendarYear]);
  const sessionsByDate = useMemo(() => roadmapSessions.reduce((grouped, session) => {
    const key = sessionDateKey(session, session.timeZone);
    grouped[key] = [...(grouped[key] || []), session];
    return grouped;
  }, {}), [roadmapSessions]);
  const calendarWeeks = useMemo(() => Array.from({
    length: 6
  }, (_, week) => calendarDays.slice(week * 7, (week + 1) * 7)), [calendarDays]);
  const selectedDaySessions = sessionsByDate[selectedCalendarDay] || [];
  const difficultySegments = ['easy', 'medium', 'hard'].map(difficulty => ({
    difficulty,
    count: problemCounts[difficulty]
  }));
  const gaugeSegments = [{
    difficulty: 'easy',
    length: 62.8,
    offset: 0
  }, {
    difficulty: 'medium',
    length: 94.2,
    offset: -68
  }, {
    difficulty: 'hard',
    length: 31.4,
    offset: -167
  }].map(segment => {
    const solved = progressStatus === 'ready' ? problemCounts[`${segment.difficulty}Solved`] : 0;
    const total = problemCounts[segment.difficulty];
    const progressLength = total && solved ? segment.length * (solved / total) : 0;
    return {
      ...segment,
      progressLength
    };
  });
  const changeCalendarMonth = amount => {
    const nextMonth = new Date(Date.UTC(calendarYear, calendarMonthIndex + amount, 1));
    setCalendarMonth(nextMonth);
    setSelectedCalendarDay(`${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}-01`);
  };
  const selectedNode = selectedId ? graph.nodeById.get(selectedId) : null;
  const selectedProgress = selectedNode ? problemCounts.byTopic.get(String(selectedNode._id)) || {
    total: 0,
    solved: 0
  } : {
    total: 0,
    solved: 0
  };
  const selectedDependencies = (selectedNode?.dependencies || []).map(String).map(dependency => graph.nodeById.get(dependency)).filter(Boolean);
  useEffect(() => {
    if (!selectedNode) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogCloseRef.current?.focus();
    const onKeyDown = event => {
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
    setView(current => clampGraphView({
      zoom,
      x: anchorX - (anchorX - current.x) / current.zoom * zoom,
      y: anchorY - (anchorY - current.y) / current.zoom * zoom
    }, viewport, graph));
  };
  const resetView = () => setView(clampGraphView({
    zoom: 1,
    x: (viewport.width - graph.width) / 2,
    y: (viewport.height - graph.height) / 2
  }, viewport, graph));
  const onPointerDown = event => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const onNode = Boolean(event.target.closest('.learning-path-node'));
    if (event.target.closest('.learning-graph-controls')) return;
    const captureTarget = onNode ? event.target.closest('.learning-path-node') : event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);
    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });
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
        moved: false
      };
      return;
    }
    gesture.current = {
      kind: 'pan',
      startX: event.clientX,
      startY: event.clientY,
      x: view.x,
      y: view.y,
      moved: false
    };
  };
  const onPointerMove = event => {
    if (activePointers.current.has(event.pointerId)) activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });
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
      const nextX = anchorX - (anchorX - currentGesture.x) / currentGesture.zoom * zoom + centerX - currentGesture.centerX;
      const nextY = anchorY - (anchorY - currentGesture.y) / currentGesture.zoom * zoom + centerY - currentGesture.centerY;
      gesture.current.moved = true;
      setIsPanning(true);
      setView(clampGraphView({
        x: nextX,
        y: nextY,
        zoom
      }, viewport, graph));
      return;
    }
    if (currentGesture.kind !== 'pan') return;
    const deltaX = event.clientX - currentGesture.startX;
    const deltaY = event.clientY - currentGesture.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) currentGesture.moved = true;
    if (currentGesture.moved) {
      event.preventDefault();
      setIsPanning(true);
      setView(clampGraphView({
        ...view,
        x: currentGesture.x + deltaX,
        y: currentGesture.y + deltaY
      }, viewport, graph));
    }
  };
  const onPointerUp = event => {
    activePointers.current.delete(event.pointerId);
    setIsPanning(false);
    if (gesture.current?.moved) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
    if (activePointers.current.size < 2) gesture.current = null;
  };
  const toggleProblem = async (node, problem) => {
    const key = problemProgressKey(node._id, problem.url);
    if (!token || user?.role !== 'user' || progressStatus !== 'ready' || pendingKeys.has(key)) return;
    const solved = !solvedKeys.has(key);
    setPendingKeys(current => new Set(current).add(key));
    setSolvedKeys(current => {
      const next = new Set(current);
      if (solved) next.add(key);else next.delete(key);
      return next;
    });
    setProgressError('');
    try {
      const result = await api(`/roadmaps/${encodeURIComponent(roadmapSlug)}/progress`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          nodeId: String(node._id),
          problemUrl: problem.url,
          solved
        })
      });
      const stored = result.solvedProblems.some(({
        nodeId,
        problemUrl
      }) => problemProgressKey(nodeId, problemUrl) === key);
      setSolvedKeys(current => {
        const next = new Set(current);
        if (stored) next.add(key);else next.delete(key);
        return next;
      });
    } catch (reason) {
      setSolvedKeys(current => {
        const next = new Set(current);
        if (solved) next.delete(key);else next.add(key);
        return next;
      });
      setProgressError(reason.message);
    } finally {
      setPendingKeys(current => {
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
        <div className={`learning-graph-canvas${isPanning ? ' is-panning' : ''}`} ref={viewportRef} aria-label="Interactive graph. Drag to pan, use the wheel to zoom, or pinch on touch screens." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}>
          <div className="learning-path-board" style={{
            width: graph.width,
            height: graph.height,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`
          }}>
            <svg className="learning-path-edges" width={graph.width} height={graph.height} aria-hidden="true">
              {graph.edges.map(edge => <path key={edge.id} d={edge.path} />)}
            </svg>
            {nodes.map((node, index) => {
              const position = graph.positions.get(String(node._id));
              const progress = problemCounts.byTopic.get(String(node._id)) || {
                total: 0,
                solved: 0
              };
              const progressPercent = progress.total ? Math.round(progress.solved / progress.total * 100) : 0;
              return <button className={`learning-path-node${selectedId === String(node._id) ? ' selected' : ''}`} data-node-color={index % 6} style={{
                left: position.x,
                top: position.y,
                width: graph.nodeWidth
              }} key={node._id} type="button" aria-pressed={selectedId === String(node._id)} onClick={event => {
                if (suppressClick.current) {
                  event.preventDefault();
                  suppressClick.current = false;
                  return;
                }
                setSelectedId(String(node._id));
              }}>
                <strong>{node.title}</strong>
                <span className="learning-path-node-progress" role="progressbar" aria-label={`${node.title} solved problems`} aria-valuemin={0} aria-valuemax={progress.total || 1} aria-valuenow={progress.solved}>
                  <span style={{
                    width: `${progressPercent}%`
                  }} />
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
              {difficultySegments.map(({
                difficulty,
                count
              }) => <div className="learning-sidebar-difficulty" key={difficulty}>
                  <span>{difficulty}</span>
                  <strong>{progressStatus === 'ready' ? problemCounts[`${difficulty}Solved`] : '—'} / {count}</strong>
                </div>)}
            </div>
            <div className="learning-progress-gauge" role="progressbar" aria-label="Overall roadmap progress" aria-valuemin={0} aria-valuemax={problemCounts.total || 1} aria-valuenow={progressStatus === 'ready' ? problemCounts.solved : undefined} aria-valuetext={progressStatus === 'ready' ? `${problemCounts.solved} of ${problemCounts.total} problems solved` : progressStatus === 'loading' ? 'Loading progress' : 'Progress is unavailable'}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                {gaugeSegments.map(({
                  difficulty,
                  length,
                  offset,
                  progressLength
                }) => <g className={`learning-progress-gauge-segment segment-${difficulty}`} key={difficulty}>
                    <circle className="learning-progress-gauge-track" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${length} 188.4`} strokeDashoffset={offset} />
                    {progressLength > 0 ? <circle className="learning-progress-gauge-value" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${progressLength} 251.2`} strokeDashoffset={offset} /> : <circle className="learning-progress-gauge-marker" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray="1 250.2" strokeDashoffset={offset} />}
                  </g>)}
              </svg>
              <div className="learning-progress-gauge-label">
                <strong>{progressStatus === 'ready' ? problemCounts.solved : '—'}</strong>
                <span>/{problemCounts.total}</span>
                <small>Solved</small>
              </div>
            </div>
          </div>
          {progressStatus === 'unavailable' && <p className="learning-sidebar-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your progress.</>}</p>}
          {progressStatus === 'error' && <p className="learning-progress-error" role="alert">{progressError} <button type="button" onClick={() => setProgressRetry(current => current + 1)}>Retry</button></p>}
        </section>

        <section className="learning-calendar-card" aria-labelledby="learning-calendar-title">
          <header className="learning-sidebar-card-heading">
            <h3 id="learning-calendar-title">Roadmap calendar</h3>
            <CalendarDays size={18} aria-hidden="true" />
          </header>
          <p className="learning-calendar-description">Scheduled sessions from cycles you joined.</p>
          {scheduleStatus === 'loading' && <p className="learning-sidebar-message">Loading your enrolled sessions…</p>}
          {scheduleStatus === 'unavailable' && <p className="learning-sidebar-message"><Link to="/login">Sign in</Link> to see your cycle schedule.</p>}
          {scheduleStatus === 'error' && <p className="learning-progress-error" role="alert">{scheduleError} <button type="button" onClick={() => setScheduleRetry(current => current + 1)}>Retry</button></p>}
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
                {week.map((cell, dayIndex) => cell ? <button className={`learning-calendar-day${selectedCalendarDay === cell.key ? ' is-selected' : ''}${sessionsByDate[cell.key]?.length ? ' has-session' : ''}`} type="button" role="gridcell" aria-label={`${formatCalendarDay(cell.date, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}${sessionsByDate[cell.key]?.length ? `, ${sessionsByDate[cell.key].length} scheduled sessions` : ''}`} aria-pressed={selectedCalendarDay === cell.key} key={cell.key} onClick={() => setSelectedCalendarDay(cell.key)}>
                    <span>{cell.day}</span>
                    {sessionsByDate[cell.key]?.length > 0 && <i aria-hidden="true" />}
                  </button> : <span className="learning-calendar-day is-outside" aria-hidden="true" key={`outside-${weekIndex}-${dayIndex}`} />)}
              </div>)}
            </div>
            <div className="learning-calendar-session-list" aria-live="polite">
              <h4>{formatCalendarDay(new Date(`${selectedCalendarDay}T12:00:00Z`), {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}</h4>
              {selectedDaySessions.length ? selectedDaySessions.map(session => <Link className={`learning-calendar-session${session.status === 'cancelled' ? ' is-cancelled' : ''}`} key={session._id} to={`/roadmaps/${encodeURIComponent(roadmapSlug)}/cycles/${encodeURIComponent(session.cycleId)}`}>
                  <span><strong>{session.title}</strong><small>{session.cycleTitle}</small></span>
                  <small>{new Intl.DateTimeFormat(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: session.timeZone
                  }).format(new Date(session.startsAt))}</small>
                </Link>) : <p>{roadmapSessions.length ? 'No sessions scheduled for this day.' : 'No enrolled cycle sessions yet.'}</p>}
            </div>
            {!roadmapSessions.length && <Link className="learning-calendar-cycles-link" to="/training">Explore Training <ArrowRight size={14} /></Link>}
          </>}
        </section>
      </aside>

      {selectedNode && <div className="learning-node-dialog-backdrop" onMouseDown={event => {
        if (event.target === event.currentTarget) setSelectedId('');
      }}>
        <aside className="learning-node-dialog" role="dialog" aria-modal="true" aria-labelledby="learning-node-dialog-title">
          <button ref={dialogCloseRef} className="learning-node-dialog-close" type="button" aria-label="Close topic details" onClick={() => setSelectedId('')}><X size={20} /></button>
          <header className="learning-node-dialog-header">
            <h2 id="learning-node-dialog-title">{selectedNode.title}</h2>
            {selectedNode.description && <p className="learning-node-dialog-description">{selectedNode.description}</p>}
            <p>{progressStatus === 'ready' ? `${selectedProgress.solved} / ${selectedProgress.total} solved` : `${selectedProgress.total} ${selectedProgress.total === 1 ? 'problem' : 'problems'}`}</p>
            <div className="learning-node-progress-track" style={{
              '--progress-percent': `${selectedProgress.total ? selectedProgress.solved / selectedProgress.total * 100 : 0}%`
            }} role="progressbar" aria-label={`${selectedNode.title} solved problems`} aria-valuemin={0} aria-valuemax={selectedProgress.total || 1} aria-valuenow={selectedProgress.solved}>
            </div>
          </header>
          <section className="learning-node-prerequisites" aria-labelledby="learning-node-prerequisites-title">
            <h3 id="learning-node-prerequisites-title">Prerequisites</h3>
            {selectedDependencies.length > 0 ? <div className="learning-node-prerequisite-list">
              {selectedDependencies.map(dependency => {
                const counts = problemCounts.byTopic.get(String(dependency._id)) || {
                  total: 0,
                  solved: 0
                };
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
              {['easy', 'medium', 'hard'].map(difficulty => <span key={difficulty}><i className={`legend-${difficulty}`} />{difficulty} {progressStatus === 'ready' ? `${problemCounts[`${difficulty}Solved`]}/${problemCounts[difficulty]}` : '—'}</span>)}
            </div>
          </section>
          {progressStatus === 'unavailable' && <p className="learning-node-progress-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your problem progress.</>}</p>}
          {(progressStatus === 'error' || progressError) && <p className="learning-progress-error" role="alert">{progressError} {progressStatus === 'error' && <button type="button" onClick={() => setProgressRetry(current => current + 1)}>Retry</button>}</p>}
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
            {selectedNode.resources.map(resource => <a key={`${resource.title}-${resource.url}`} href={resource.url} target="_blank" rel="noreferrer">{resource.title} <ExternalLink size={14} /></a>)}
          </section>}
        </aside>
      </div>}
    </div>}
  </section>;
}
