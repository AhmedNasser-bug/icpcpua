import Registration from '../models/Registration.js';

export function getLeaderboardEntries() {
  return Registration.aggregate([
    { $match: { checkedInAt: { $type: 'date' } } },
    {
      $group: {
        _id: '$user',
        points: { $sum: '$pointsAwarded' },
        eventsAttended: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.role': 'user',
        'user.profile.privacy.profileVisible': { $ne: false },
        'user.profile.privacy.leaderboardVisible': { $ne: false },
      },
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        avatarUrl: '$user.profile.pictureUrl',
        points: 1,
        eventsAttended: 1,
      },
    },
    { $sort: { points: -1, eventsAttended: -1, name: 1, userId: 1 } },
  ]);
}

export function findAttendanceHistory(userId) {
  return Registration.find({ user: userId, checkedInAt: { $ne: null } })
    .populate('event', 'title slug category startsAt location')
    .sort({ checkedInAt: -1 });
}

export function findUserRegistrations(userId) {
  return Registration.find({ user: userId }).populate('event').sort({ createdAt: -1 });
}

export function findUserEventRegistration(userId, eventId) {
  return Registration.findOne({ user: userId, event: eventId });
}

export function findUserEventRegistrationExists(userId, eventId) {
  return Registration.exists({ user: userId, event: eventId });
}

export function updateCheckIn(userId, eventId, pointsAwarded, checkedInAt) {
  return Registration.findOneAndUpdate(
    { user: userId, event: eventId, checkedInAt: null },
    { $set: { checkedInAt, pointsAwarded } },
    { new: true },
  );
}

export function findEventRegistrations(eventId) {
  return Registration.find({ event: eventId }).populate('user', 'name email').sort({ createdAt: 1 });
}

export function createRegistration(userId, eventId) {
  return Registration.create({ user: userId, event: eventId });
}

export function deleteUnattendedRegistration(eventId, userId) {
  return Registration.findOneAndDelete({ event: eventId, user: userId, checkedInAt: null });
}

export function findEventAttendanceStats(eventIds) {
  return Registration.aggregate([
    { $match: { event: { $in: eventIds } } },
    {
      $group: {
        _id: '$event',
        attendanceCount: { $sum: { $cond: [{ $eq: [{ $type: '$checkedInAt' }, 'date'] }, 1, 0] } },
        totalPointsAwarded: { $sum: { $ifNull: ['$pointsAwarded', 0] } },
      },
    },
  ]);
}
