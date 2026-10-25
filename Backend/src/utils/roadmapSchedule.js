const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function invalid(message) {
  throw Object.assign(new Error(message), { status: 400 });
}

function parseDateOnly(value, field) {
  const match = DATE_PATTERN.exec(value || '');
  if (!match) invalid(`${field} must use YYYY-MM-DD format.`);
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== value) invalid(`${field} must be a real calendar date.`);
  return date;
}

function zonedParts(date, timeZone) {
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

function matchesLocalDateTime(date, expected, timeZone) {
  const actual = zonedParts(date, timeZone);
  return actual.year === expected.year
    && actual.month === expected.month
    && actual.day === expected.day
    && actual.hour === expected.hour
    && actual.minute === expected.minute
    && actual.second === 0;
}

function localDateTimeToUtc(date, time, timeZone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const expected = { year, month, day, hour, minute };
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const parts = zonedParts(new Date(wallTime + hours * 60 * 60 * 1000), timeZone);
    offsets.add(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - (wallTime + hours * 60 * 60 * 1000));
  }
  const candidates = [...offsets]
    .map((offset) => new Date(wallTime - offset))
    .filter((candidate) => matchesLocalDateTime(candidate, expected, timeZone))
    .sort((left, right) => left - right);
  if (!candidates.length) invalid(`The configured local session time does not exist on ${date} in ${timeZone}.`);
  return candidates[0];
}

export function generateSessionSchedule(cycle) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en', { timeZone: cycle.timeZone });
  } catch {
    invalid('timeZone must be a valid IANA time zone.');
  }
  formatter.format(new Date());

  const start = parseDateOnly(cycle.startDate, 'startDate');
  const end = parseDateOnly(cycle.endDate, 'endDate');
  if (end < start) invalid('endDate must be on or after startDate.');
  if (!TIME_PATTERN.test(cycle.startTime || '')) invalid('startTime must use 24-hour HH:mm format.');
  if (!Number.isInteger(cycle.sessionsPerWeek) || cycle.sessionsPerWeek < 1 || cycle.sessionsPerWeek > 7) {
    invalid('sessionsPerWeek must be a whole number from 1 to 7.');
  }
  if (!Array.isArray(cycle.trainingDays) || cycle.trainingDays.length !== cycle.sessionsPerWeek) {
    invalid('The number of selected trainingDays must match sessionsPerWeek.');
  }
  if (cycle.trainingDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    || new Set(cycle.trainingDays).size !== cycle.trainingDays.length) {
    invalid('trainingDays must contain unique weekdays from 0 (Sunday) to 6 (Saturday).');
  }
  if (!Number.isInteger(cycle.sessionDurationMinutes) || cycle.sessionDurationMinutes < 15 || cycle.sessionDurationMinutes > 600) {
    invalid('sessionDurationMinutes must be a whole number from 15 to 600.');
  }

  const weekdays = new Set(cycle.trainingDays);
  const sessions = [];
  for (let day = start.getTime(); day <= end.getTime(); day += DAY_MS) {
    const date = new Date(day);
    if (!weekdays.has(date.getUTCDay())) continue;
    const localDate = date.toISOString().slice(0, 10);
    const startsAt = localDateTimeToUtc(localDate, cycle.startTime, cycle.timeZone);
    sessions.push({
      ordinal: sessions.length + 1,
      title: `Session ${sessions.length + 1}`,
      startsAt,
      endsAt: new Date(startsAt.getTime() + cycle.sessionDurationMinutes * 60_000),
      timeZone: cycle.timeZone,
      attendancePoints: cycle.attendancePoints || 0,
    });
    if (sessions.length > 500) invalid('A cycle schedule cannot exceed 500 generated sessions.');
  }
  if (!sessions.length) invalid('The selected training days do not occur within the cycle date range.');
  return sessions;
}
