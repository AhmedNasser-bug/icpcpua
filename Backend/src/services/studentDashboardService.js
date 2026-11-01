import { getMemberLeaderboard, getMyEvents } from './eventService.js';
import { getStudentRoadmaps } from './roadmapService.js';

export async function getStudentDashboard(userId, now = new Date()) {
  const [standingResult, events, training] = await Promise.all([
    getMemberLeaderboard(userId),
    getMyEvents(userId),
    getStudentRoadmaps(userId),
  ]);
  const cycles = training.roadmaps.map(({ roadmap, cycle, progress }) => {
    const nextSession = cycle.sessions
      .filter((session) => session.status !== 'cancelled' && session.status !== 'completed' && new Date(session.startsAt) > now)
      .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
    return {
      id: cycle._id,
      title: cycle.title,
      roadmapTitle: roadmap.title,
      roadmapSlug: roadmap.slug,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      progress,
      nextSession,
    };
  });
  return {
    stats: {
      points: standingResult.standing.points,
      eventsAttended: standingResult.standing.eventsAttended,
      registeredEvents: events.length,
      trainingCycles: cycles.length,
    },
    recentAttendance: standingResult.attendanceHistory.slice(0, 3),
    cycles,
  };
}
