import Event from '../models/Event.js';

export function findAllEvents() {
  return Event.find().sort({ startsAt: -1 });
}

export function createEvent(data) {
  return Event.create(data);
}

export function findEventById(id) {
  return Event.findById(id);
}

export function updateEventIfActive(id, data) {
  return Event.findOneAndUpdate(
    { _id: id, status: { $ne: 'deleted' } },
    data,
    { new: true, runValidators: true },
  );
}

export function findEventTitleAndStatus(id) {
  return Event.findById(id).select('title status');
}

export function archiveEvent(id, confirmationName) {
  return Event.findOneAndUpdate(
    { _id: id, title: confirmationName, status: { $ne: 'deleted' } },
    { $set: { status: 'deleted', deletedAt: new Date(), checkInTokenHash: null } },
    { new: true },
  );
}

export function setCheckInTokenForPublishedEvent(id, tokenHash) {
  return Event.updateOne(
    { _id: id, status: 'published' },
    { $set: { checkInTokenHash: tokenHash } },
  );
}

export function findRegistrationsEvent(id) {
  return Event.findById(id).select('title');
}
