import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, ExternalLink, FileText, LockKeyhole, Maximize2, PlayCircle, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { api } from "../../../shared/services/api.js";
import { weekdays, sessionDateKey, formatCalendarMonth, formatCalendarDay, problemProgressKey, clampGraphView } from '../utils/roadmapUtils.js';
function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}
export function LearningPath({
  nodes = [],
  token,
  user,
  roadmapSlug
}) {
  const viewportRef = useRef(null);
  const dialogCloseRef = useRef(null);
  const nodeButtonRefs = useRef(new Map());
  const lastFocusedNode = useRef('');
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
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
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
    const nodeHeight = 94;
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
        from: dependency,
        to: String(node._id),
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
        const difficulty = ['easy', 'medium', 'hard'].includes(problem.difficulty?.toLowerCase()) ? problem.difficulty.toLowerCase() : null;
        const solved = solvedKeys.has(problemProgressKey(node._id, problem.url));
        counts.total += 1;
        topic.total += 1;
        if (difficulty) counts[difficulty] += 1;
        if (solved) {
          counts.solved += 1;
          if (difficulty) counts[`${difficulty}Solved`] += 1;
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
  const topicStates = useMemo(() => {
    const states = new Map();
    for (const node of nodes) {
      const id = String(node._id);
      const progress = problemCounts.byTopic.get(id) || { total: 0, solved: 0 };
      const completed = progressStatus === 'ready' && progress.total > 0 && progress.solved === progress.total;
      const dependencyIds = (node.dependencies || []).map(String);
      const unmetDependencies = dependencyIds.filter(dependencyId => {
        const dependency = graph.nodeById.get(dependencyId);
        if (!dependency || progressStatus !== 'ready') return true;
        const dependencyProgress = problemCounts.byTopic.get(dependencyId) || { total: 0, solved: 0 };
        return dependencyProgress.total === 0 || dependencyProgress.solved !== dependencyProgress.total;
      });
      states.set(id, {
        completed,
        unlocked: dependencyIds.length === 0 || unmetDependencies.length === 0,
        unmetDependencies
      });
    }
    return states;
  }, [graph.nodeById, nodes, problemCounts.byTopic, progressStatus]);
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
  useEffect(() => {
    if (!selectedNode) {
      const previousNode = nodeButtonRefs.current.get(lastFocusedNode.current);
      previousNode?.focus();
      return undefined;
    }
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
  const closeDetails = () => setSelectedId('');
  const focusPrerequisite = dependencyId => {
    const button = nodeButtonRefs.current.get(String(dependencyId));
    if (button) {
      lastFocusedNode.current = String(dependencyId);
      setView(current => {
        const position = graph.positions.get(String(dependencyId));
        if (!position || !viewport.width || !viewport.height) return current;
        return clampGraphView({
          ...current,
          x: viewport.width / 2 - (position.x + graph.nodeWidth / 2) * current.zoom,
          y: viewport.height / 2 - (position.y + graph.nodeHeight / 2) * current.zoom
        }, viewport, graph);
      });
      setSelectedId(String(dependencyId));
      window.requestAnimationFrame(() => dialogCloseRef.current?.focus());
    }
  };
  const handleDialogKeyDown = event => {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget;
    const focusable = [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) {
      event.preventDefault();
      dialogCloseRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
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
    const topicState = topicStates.get(String(node._id));
    if (!token || user?.role !== 'user' || progressStatus !== 'ready' || !safeExternalUrl(problem.url) || (!topicState?.completed && topicState?.unmetDependencies.length) || pendingKeys.has(key)) return;
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
  const selectedTopicState = selectedNode ? topicStates.get(String(selectedNode._id)) : null;
  const selectedUnmetDependencies = selectedTopicState && !selectedTopicState.completed ? selectedTopicState.unmetDependencies : [];
  const nodeSubtopics = selectedNode?.subtopics || selectedNode?.subTopics;
  const selectedSubtopics = Array.isArray(nodeSubtopics)
    ? nodeSubtopics.filter(Boolean)
    : typeof nodeSubtopics === 'string'
      ? nodeSubtopics.split(',').map(item => item.trim()).filter(Boolean)
      : [];
  const selectedTheory = selectedNode?.theory || selectedNode?.learningNotes || selectedNode?.content;
  return <section className="learning-path-section" aria-labelledby="learning-path-heading">
    {!nodes.length ? <div className="empty-state"><h3>Learning topics are coming soon.</h3><p>This roadmap’s learning path is being prepared.</p></div> : <div className="learning-roadmap-layout">
      <section className="learning-graph-panel" aria-label="Interactive learning roadmap">
        <div className={`learning-graph-canvas${isPanning ? ' is-panning' : ''}`} ref={viewportRef} aria-label="Interactive graph. Drag to pan, use the wheel to zoom, or pinch on touch screens." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}>
          <div className="learning-path-board" style={{
            width: graph.width,
            height: graph.height,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`
          }}>
            <svg className="learning-path-edges" width={graph.width} height={graph.height} aria-hidden="true">
              {graph.edges.map(edge => <path className={topicStates.get(edge.from)?.completed ? 'is-satisfied' : 'is-locked'} key={edge.id} d={edge.path} />)}
            </svg>
            {nodes.map((node, index) => {
              const position = graph.positions.get(String(node._id));
              const progress = problemCounts.byTopic.get(String(node._id)) || {
                total: 0,
                solved: 0
              };
              const state = topicStates.get(String(node._id));
              const topicState = state?.completed ? 'completed' : state?.unlocked ? 'unlocked' : 'locked';
              const progressPercent = progress.total ? Math.round(progress.solved / progress.total * 100) : 0;
              const progressLabel = progressStatus === 'ready' ? `${progress.solved}/${progress.total} Solved` : 'Progress unavailable';
              const statusMeta = state?.completed ? { icon: '✓', label: 'Completed' } : state?.unlocked ? { icon: '📖', label: 'Open' } : { icon: '🔒', label: 'Locked' };
              return <button ref={element => {
                if (element) nodeButtonRefs.current.set(String(node._id), element);
                else nodeButtonRefs.current.delete(String(node._id));
              }} className={`learning-path-node${selectedId === String(node._id) ? ' selected' : ''}`} data-node-state={topicState} data-node-color={index % 6} style={{
                left: position.x,
                top: position.y,
                width: graph.nodeWidth
              }} key={node._id} type="button" aria-label={`${node.title}, ${progressLabel}, ${statusMeta.label}`} aria-pressed={selectedId === String(node._id)} onClick={event => {
                if (suppressClick.current) {
                  event.preventDefault();
                  suppressClick.current = false;
                  return;
                }
                lastFocusedNode.current = String(node._id);
                setSelectedId(String(node._id));
              }}>
                <div className="learning-path-node-header">
                  <strong>{node.title}</strong>
                  <span className="learning-path-node-status" aria-hidden="true">{statusMeta.icon}</span>
                </div>
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
            <div className="learning-sidebar-difficulty-list">
              {difficultySegments.map(({
                difficulty,
                count
              }) => <div className="learning-sidebar-difficulty" key={difficulty}>
                  <span>{difficulty}</span>
                  <strong>{progressStatus === 'ready' ? problemCounts[`${difficulty}Solved`] : '—'} / {count}</strong>
                </div>)}
            </div>
          </div>
          {progressStatus === 'unavailable' && <p className="learning-sidebar-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your progress.</>}</p>}
          {progressStatus === 'error' && <p className="learning-progress-error" role="alert">{progressError} <button type="button" onClick={() => setProgressRetry(current => current + 1)}>Retry</button></p>}
        </section>

        <section className="learning-calendar-card" aria-labelledby="learning-calendar-title">
          <header className="learning-sidebar-card-heading">
            <h3 id="learning-calendar-title">Roadmap calendar</h3>
            <button type="button" className="learning-calendar-collapse-button" aria-label={calendarCollapsed ? 'Expand roadmap calendar' : 'Collapse roadmap calendar'} onClick={() => setCalendarCollapsed(current => !current)}>
              {calendarCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
            </button>
          </header>
          {!calendarCollapsed && <>
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
          </>}
        </section>
      </aside>

      {selectedNode && <div className="learning-node-dialog-backdrop" onMouseDown={event => {
        if (event.target === event.currentTarget) closeDetails();
      }}>
        <aside className="learning-node-dialog" role="dialog" aria-modal="true" aria-labelledby="learning-node-dialog-title" onKeyDown={handleDialogKeyDown}>
          <button ref={dialogCloseRef} className="learning-node-dialog-close" type="button" aria-label="Close topic details" onClick={closeDetails}><X size={20} /></button>
          <header className="learning-node-dialog-header">
            {(selectedNode.category || selectedNode.level) && <span className="learning-node-category">{selectedNode.category || selectedNode.level}</span>}
            <h2 id="learning-node-dialog-title">{selectedNode.title}</h2>
            {selectedNode.description && <p className="learning-node-dialog-description">{selectedNode.description}</p>}
            <p className="learning-node-completion-status">
              {selectedTopicState?.completed ? <><Check size={15} aria-hidden="true" /> Completed</> : selectedUnmetDependencies.length ? <><LockKeyhole size={14} aria-hidden="true" /> Theory open · Problems locked</> : 'Problems available'}
            </p>
            <p className="learning-node-count">{progressStatus === 'ready' ? `${selectedProgress.solved} / ${selectedProgress.total} problems solved` : `${selectedProgress.total} ${selectedProgress.total === 1 ? 'problem' : 'problems'} · Progress ${progressStatus === 'loading' ? 'loading' : 'unavailable'}`}</p>
            <div className={`learning-node-progress-track${selectedTopicState?.completed ? ' is-completed' : ''}`} style={{
              '--progress-percent': `${selectedProgress.total ? selectedProgress.solved / selectedProgress.total * 100 : 0}%`
            }} role="progressbar" aria-label={`${selectedNode.title} solved problems`} aria-valuemin={0} aria-valuemax={selectedProgress.total || 1} aria-valuenow={progressStatus === 'ready' ? selectedProgress.solved : undefined} aria-valuetext={progressStatus === 'ready' ? `${selectedProgress.solved} of ${selectedProgress.total} solved` : 'Progress unavailable'} />
          </header>

          {selectedSubtopics.length > 0 && <section className="learning-node-subtopics" aria-label="Subtopics">
            {selectedSubtopics.map((subtopic, index) => <span key={`${subtopic}-${index}`}>{subtopic}</span>)}
          </section>}

          <section className="learning-node-theory" aria-labelledby="learning-node-theory-title">
            <h3 id="learning-node-theory-title"><BookOpen size={16} aria-hidden="true" /> Theory</h3>
            {typeof selectedTheory === 'string' && selectedTheory.trim()
              ? <div className="learning-node-theory-content">{selectedTheory}</div>
              : typeof selectedTheory?.text === 'string' && selectedTheory.text.trim()
                ? <div className="learning-node-theory-content">{selectedTheory.text}</div>
                : <p className="learning-topic-empty">Theory notes have not been added for this topic yet.</p>}
          </section>

          <section className="learning-node-prerequisites" aria-labelledby="learning-node-prerequisites-title">
            <h3 id="learning-node-prerequisites-title">Prerequisites</h3>
            {(selectedNode.dependencies || []).length ? <div className="learning-node-prerequisite-list">
              {(selectedNode.dependencies || []).map((dependencyId, index) => {
                const id = String(dependencyId);
                const dependency = graph.nodeById.get(id);
                const counts = problemCounts.byTopic.get(id) || { total: 0, solved: 0 };
                const completed = progressStatus === 'ready' && counts.total > 0 && counts.solved === counts.total;
                return dependency ? <button className={completed ? 'is-completed' : ''} key={id} type="button" onClick={() => focusPrerequisite(id)}>
                  <strong>{dependency.title}</strong>
                  <span>{completed ? 'Completed · ' : ''}{progressStatus === 'ready' ? `${counts.solved} / ${counts.total} solved` : 'Progress unavailable'}</span>
                  <span className="learning-prerequisite-jump">View topic <ArrowRight size={13} aria-hidden="true" /></span>
                </button> : <div className="learning-node-prerequisite-missing" key={`${id}-${index}`}>
                  <strong>Prerequisite unavailable</strong><span>This roadmap references a topic that is no longer available.</span>
                </div>;
              })}
            </div> : <p className="learning-topic-empty">No prerequisites for this topic.</p>}
          </section>

          {progressStatus === 'unavailable' && <p className="learning-node-progress-message">{token ? 'Student accounts can track problem progress.' : <><Link to="/login">Sign in</Link> to save your problem progress.</>}</p>}
          {(progressStatus === 'error' || progressError) && <p className="learning-progress-error" role="alert">{progressError} {progressStatus === 'error' && <button type="button" onClick={() => setProgressRetry(current => current + 1)}>Retry</button>}</p>}

          <section className={`learning-node-problems${selectedUnmetDependencies.length ? ' is-locked' : ''}`} aria-labelledby="learning-node-problems-title">
            <h3 id="learning-node-problems-title">Problems <span>{selectedNode.problems?.length || 0}</span></h3>
            {selectedUnmetDependencies.length > 0 && <div className="learning-node-lock-notice" role="status">
              <strong><LockKeyhole size={16} aria-hidden="true" /> Complete prerequisites to unlock problems.</strong>
              {progressStatus !== 'ready' && <p>Sign in or retry progress loading so prerequisite completion can be verified.</p>}
              <div className="learning-node-lock-actions">
                {selectedUnmetDependencies.map((dependencyId, index) => {
                  const dependency = graph.nodeById.get(String(dependencyId));
                  return dependency ? <button key={String(dependencyId)} type="button" onClick={() => focusPrerequisite(dependencyId)}>Jump to Prerequisite Node: {dependency.title} <ArrowRight size={14} aria-hidden="true" /></button> : <span key={`${dependencyId}-${index}`}>A prerequisite topic is unavailable.</span>;
                })}
              </div>
            </div>}
            {selectedNode.problems?.length ? <div className="learning-node-problem-list">
              <div className="learning-node-problem-header" aria-hidden="true"><span>Done</span><span>Problem</span><span>Difficulty</span><span>Action</span></div>
              {(selectedNode.problems || []).map((problem, index) => {
                const key = problemProgressKey(selectedId, problem.url);
                const difficulty = ['easy', 'medium', 'hard'].includes(problem.difficulty?.toLowerCase()) ? problem.difficulty.toLowerCase() : null;
                const checked = solvedKeys.has(key);
                const problemUrl = safeExternalUrl(problem.url);
                const platform = problem.platformTag || problem.platform || (problemUrl ? new URL(problemUrl).hostname.replace(/^www\./i, '') : '');
                const locked = selectedUnmetDependencies.length > 0;
                return <div className={`learning-node-problem-row${checked ? ' solved' : ''}${locked ? ' is-locked' : ''}`} key={`${problem.url}-${index}`}>
                  <label className="learning-problem-check">
                    <input type="checkbox" aria-label={`I solved ${problem.title}`} checked={checked} disabled={locked || progressStatus !== 'ready' || !problemUrl || pendingKeys.has(key)} onChange={() => toggleProblem(selectedNode, problem)} />
                    <span className="learning-problem-checkmark" />
                  </label>
                  <span className="learning-node-problem-copy"><strong>{problem.title}</strong>{platform && <small>{platform}</small>}</span>
                  {difficulty ? <span className={`learning-problem-difficulty difficulty-${difficulty}`}>{difficulty}</span> : <span className="learning-problem-difficulty difficulty-unspecified">Not specified</span>}
                  {locked || !problemUrl
                    ? <button className="learning-node-problem-locked" type="button" disabled title={locked ? 'Complete prerequisites to unlock' : 'Problem link unavailable'} aria-label={locked ? `Locked: ${problem.title}. Complete prerequisites to unlock` : `${problem.title} link unavailable`}>{locked ? <><LockKeyhole size={14} /> Locked</> : 'Unavailable'}</button>
                    : <a className="learning-node-problem-solve" href={problemUrl} target="_blank" rel="noopener noreferrer" aria-label={`Solve ${problem.title} on ${platform || 'the linked platform'}`}>Solve <ExternalLink size={14} aria-hidden="true" /></a>}
                </div>;
              })}
            </div> : <p className="learning-topic-empty">No problems added to this topic yet.</p>}
            {selectedNode.problems?.length > 0 && progressStatus === 'ready' && <p className="learning-node-recording-note">Use “I solved” only after completing the linked problem. Opening an external link does not record completion.</p>}
          </section>

          <section className="learning-node-resources" aria-labelledby="learning-node-resources-title">
            <h3 id="learning-node-resources-title"><FileText size={16} aria-hidden="true" /> Learning resources</h3>
            {selectedNode.resources?.length ? selectedNode.resources.map((resource, index) => {
              const resourceUrl = safeExternalUrl(resource.url);
              const resourceType = resource.type || resource.resourceType || '';
              const ResourceIcon = /video/i.test(resourceType) ? PlayCircle : BookOpen;
              return <article className="learning-node-resource-card" key={`${resource.title || 'resource'}-${resource.url || index}`}>
                <ResourceIcon size={18} aria-hidden="true" />
                <div><strong>{resource.title || 'Learning resource'}</strong><span>{[resourceType, resource.provider || resource.platform].filter(Boolean).join(' · ')}</span></div>
                {resourceUrl ? <a href={resourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.title || 'learning resource'} in a new tab`}><ExternalLink size={15} aria-hidden="true" /></a> : <span className="learning-resource-unavailable">Link unavailable</span>}
              </article>;
            }) : <p className="learning-topic-empty">No learning resources have been added for this topic yet.</p>}
          </section>
        </aside>
      </div>}
    </div>}
  </section>;
}
