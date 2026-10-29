export const weekdays = [['Sunday', 0], ['Monday', 1], ['Tuesday', 2], ['Wednesday', 3], ['Thursday', 4], ['Friday', 5], ['Saturday', 6]];
export function formatSessionTime(session) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: session.timeZone || 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(new Date(session.startsAt));
}
export function sessionDateKey(session, fallbackTimeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: session.timeZone || fallbackTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(session.startsAt));
  const values = Object.fromEntries(parts.filter(({
    type
  }) => type !== 'literal').map(({
    type,
    value
  }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function formatCalendarMonth(date, timeZone) {
  const stableDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone
  }).format(stableDate);
}
export function formatCalendarDay(date, options = {}) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
    ...options
  }).format(date);
}
export function timeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(({
    type
  }) => type !== 'literal').map(({
    type,
    value
  }) => [type, Number(value)]));
}
export function formatDateTimeInput(value, timeZone) {
  const parts = timeZoneParts(new Date(value), timeZone || 'UTC');
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}
export function dateTimeInputToIso(value, timeZone) {
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
  const candidates = [...offsets].map(offset => new Date(wallTime - offset)).filter(date => {
    const parts = timeZoneParts(date, timeZone || 'UTC');
    return parts.year === year && parts.month === month && parts.day === day && parts.hour === hour && parts.minute === minute && parts.second === 0;
  }).sort((left, right) => left - right);
  if (!candidates.length) throw new Error(`The selected local time does not exist in ${timeZone}.`);
  return candidates[0].toISOString();
}
export function problemProgressKey(nodeId, problemUrl) {
  return JSON.stringify([String(nodeId), problemUrl]);
}
export function clampGraphView(view, viewport, graph) {
  const contentWidth = graph.width * view.zoom;
  const contentHeight = graph.height * view.zoom;
  const padding = 24;
  const x = contentWidth <= viewport.width ? Math.min(viewport.width - contentWidth - padding, Math.max(padding, view.x)) : Math.min(padding, Math.max(viewport.width - contentWidth - padding, view.x));
  const y = contentHeight <= viewport.height ? Math.min(viewport.height - contentHeight - padding, Math.max(padding, view.y)) : Math.min(padding, Math.max(viewport.height - contentHeight - padding, view.y));
  return {
    ...view,
    x,
    y
  };
}
export function formatProblems(problems = []) {
  return problems.map(({
    title,
    url,
    difficulty = 'medium'
  }) => `${title} | ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} | ${url}`).join('\n');
}
export function parseProblems(value) {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length >= 3) {
      const difficulty = parts[1].toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new Error(`"${parts[1]}" is not a valid difficulty. Use Easy, Medium, or Hard.`);
      }
      const [problem] = parseResources(`${parts[0]} | ${parts.slice(2).join('|')}`);
      return {
        ...problem,
        difficulty
      };
    }
    if (parts.length === 2 && ['easy', 'medium', 'hard'].includes(parts[1].toLowerCase())) {
      throw new Error(`Add a URL after the difficulty for "${parts[0]}".`);
    }
    const [problem] = parseResources(line);
    return {
      ...problem,
      difficulty: 'medium'
    };
  });
}
export function emptyCycleForm(timeZone) {
  return {
    order: 1,
    title: '',
    description: '',
    location: '',
    difficulty: 'beginner',
    objectives: '',
    prerequisites: '',
    startDate: '',
    endDate: '',
    sessionsPerWeek: 1,
    trainingDays: [],
    startTime: '18:00',
    sessionDurationMinutes: 120,
    timeZone,
    registrationOpensAt: '',
    registrationClosesAt: '',
    capacity: '',
    attendancePoints: 0,
    status: 'draft'
  };
}
export function toCyclePayload(form) {
  return {
    order: Number(form.order),
    title: form.title,
    description: form.description,
    location: form.location,
    difficulty: form.difficulty,
    objectives: form.objectives.split('\n').map(item => item.trim()).filter(Boolean),
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
    status: form.status
  };
}
export function formatResources(resources = []) {
  return resources.map(({
    title,
    url
  }) => `${title} | ${url}`).join('\n');
}
export function parseResources(value) {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
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
    return {
      title,
      url: parsedUrl.toString()
    };
  });
}
