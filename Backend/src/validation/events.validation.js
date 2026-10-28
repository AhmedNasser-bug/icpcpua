import mongoose from 'mongoose';
import { checkInToken, emptyBody, invalid, object, optionalString, params } from './shared.js';

function eventsQuery(value) {
  const input = object(value, 'query', ['status', 'sort', 'category', 'q']);
  if (input.status !== undefined && !['upcoming', 'past'].includes(input.status)) invalid('status must be upcoming or past.', 'status');
  if (input.sort !== undefined && input.sort !== 'latest') invalid('sort must be latest.', 'sort');
  return {
    ...input,
    category: optionalString(input.category, 'category', { maxLength: 50 }),
    q: optionalString(input.q, 'q', { maxLength: 200 }),
  };
}

function checkInQuery(value) {
  const input = object(value, 'query', ['token']);
  return { token: checkInToken(input.token) };
}

function checkInBody(value) {
  const input = object(value, 'body', ['token']);
  return { token: checkInToken(input.token) };
}

function memberParams(value) {
  return params({ username: 'username' })(value);
}

function eventParams(value) {
  const input = params({ eventId: 'id' })(value);
  if (!mongoose.isValidObjectId(input.eventId)) invalid('eventId must be a valid identifier.', 'eventId');
  return input;
}

export const list = { query: eventsQuery };
export const memberProfile = { params: memberParams };
export const eventDetails = { params: eventParams };
export const checkInDetails = { params: eventParams, query: checkInQuery };
export const checkInSubmit = { params: eventParams, body: checkInBody };
export const eventAction = { params: eventParams, body: emptyBody };
