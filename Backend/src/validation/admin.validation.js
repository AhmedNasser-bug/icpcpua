import mongoose from 'mongoose';
import { validateEventInput } from '../utils/validation.js';
import {
  validateCycleInput,
  validateRoadmapInput,
  validateRoadmapNodeInput,
  validateSessionInput,
} from '../utils/roadmapValidation.js';
import { bodyObject, emptyBody, invalid, optionalString, params } from './shared.js';

function eventParams(value) {
  return params({ eventId: 'id' })(value);
}

function deleteEventBody(value) {
  const input = bodyObject(['confirmationName'], 'event confirmation')(value);
  return { confirmationName: optionalString(input.confirmationName, 'confirmationName', { maxLength: 140, required: true, trim: false }) };
}

function scheduleBody(value) {
  const input = bodyObject(['confirmationToken'], 'schedule confirmation')(value);
  return { confirmationToken: optionalString(input.confirmationToken, 'confirmationToken', { maxLength: 5000, required: true }) };
}

function attendanceBody(value) {
  const input = bodyObject(['studentId'], 'attendance details')(value);
  if (!mongoose.isValidObjectId(input.studentId)) invalid('studentId must be a valid identifier.', 'studentId');
  return { studentId: String(input.studentId) };
}

function reversePointsBody(value) {
  const input = bodyObject(['reason'], 'points reversal')(value);
  return { reason: optionalString(input.reason, 'reason', { maxLength: 300, required: true }) };
}

export const eventCreate = { body: validateEventInput };
export const eventUpdate = { params: eventParams, body: (value) => validateEventInput(value, { partial: true }) };
export const eventDelete = { params: eventParams, body: deleteEventBody };
export const eventAction = { params: eventParams, body: emptyBody };
export const roadmapCreate = { body: validateRoadmapInput };
export const roadmapUpdate = { params: params({ roadmapId: 'id' }), body: (value) => validateRoadmapInput(value, { partial: true }) };
export const roadmapNodes = { params: params({ roadmapId: 'id' }) };
export const roadmapNodeCreate = { params: params({ roadmapId: 'id' }), body: validateRoadmapNodeInput };
export const roadmapNodeUpdate = {
  params: params({ roadmapId: 'id', nodeId: 'id' }),
  body: (value) => validateRoadmapNodeInput(value, { partial: true }),
};
export const roadmapNodeAction = {
  params: params({ roadmapId: 'id', nodeId: 'id' }),
  body: emptyBody,
};
export const cycleCreate = { params: params({ roadmapId: 'id' }), body: validateCycleInput };
export const cycleUpdate = { params: params({ cycleId: 'id' }), body: (value) => validateCycleInput(value, { partial: true }) };
export const cycleAction = { params: params({ cycleId: 'id' }), body: emptyBody };
export const cycleSchedule = { params: params({ cycleId: 'id' }), body: scheduleBody };
export const sessionUpdate = { params: params({ sessionId: 'id' }), body: validateSessionInput };
export const sessionAction = { params: params({ sessionId: 'id' }), body: emptyBody };
export const attendanceCreate = { params: params({ sessionId: 'id' }), body: attendanceBody };
export const pointsReverse = {
  params: params({ sessionId: 'id', attendanceId: 'id' }),
  body: reversePointsBody,
};
