import Event from '../models/Event.js';

export function findPublicEvents(query, sort) {
  return Event.find(query).sort(sort).limit(100);
}

export function findById(id) {
  return Event.findById(id);
}

export function findPublicEvent(filter) {
  return Event.findOne(filter);
}

export function findCheckInEvent(id, tokenHash) {
  return Event.findOne({ _id: id, status: 'published', checkInTokenHash: tokenHash });
}

export function reserveRegistration(id, capacity) {
  const availabilityFilter = { _id: id, status: 'published' };
  if (capacity !== null) availabilityFilter.$expr = { $lt: ['$registrationCount', '$capacity'] };
  return Event.updateOne(availabilityFilter, { $inc: { registrationCount: 1 } });
}

export function decrementRegistrationCount(id) {
  return Event.updateOne({ _id: id, registrationCount: { $gt: 0 } }, { $inc: { registrationCount: -1 } });
}

export function findEventsForRegistration(now, id) {
  return Event.findOne({
    _id: id,
    status: 'published',
    startsAt: { $gt: now },
    $or: [{ registrationDeadline: null }, { registrationDeadline: { $gt: now } }],
  });
}

export function findEventForCancellation(id) {
  return Event.findById(id);
}
