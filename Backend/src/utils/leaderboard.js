export function rankLeaderboard(entries) {
  let rank = 0;
  let previousPoints = null;

  return entries.map((entry, index) => {
    if (index === 0 || entry.points !== previousPoints) rank += 1;
    previousPoints = entry.points;
    return { ...entry, rank };
  });
}

export function mergeLeaderboardEntries(eventEntries, roadmapEntries) {
  const combined = new Map();
  for (const entry of eventEntries) {
    combined.set(entry.userId.toString(), { ...entry, sessionsAttended: 0 });
  }
  for (const entry of roadmapEntries) {
    const key = entry.userId.toString();
    const current = combined.get(key);
    if (current) {
      current.points += entry.points;
      current.sessionsAttended = entry.sessionsAttended;
    } else {
      combined.set(key, {
        ...entry,
        eventsAttended: 0,
      });
    }
  }
  return [...combined.values()].sort((left, right) => (
    right.points - left.points
    || right.eventsAttended - left.eventsAttended
    || left.name.localeCompare(right.name)
    || left.userId.toString().localeCompare(right.userId.toString())
  ));
}
