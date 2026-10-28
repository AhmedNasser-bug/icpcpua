import { emptyBody, invalid, object, params } from './shared.js';

function notificationQuery(value) {
  const input = object(value, 'query', ['filter']);
  if (input.filter !== undefined && !['all', 'unread'].includes(input.filter)) invalid('filter must be all or unread.', 'filter');
  return input;
}

export const list = { query: notificationQuery };
export const markRead = { params: params({ notificationId: 'id' }) };
export const markAllRead = { body: emptyBody };
