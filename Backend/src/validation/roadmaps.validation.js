import {
  validateRoadmapInput,
  validateRoadmapNodeInput,
  validateRoadmapProgressInput,
} from '../utils/roadmapValidation.js';
import { checkInToken, emptyBody, object, params } from './shared.js';

function checkInQuery(value) {
  const input = object(value, 'query', ['token']);
  return { token: checkInToken(input.token) };
}

function checkInBody(value) {
  const input = object(value, 'body', ['token']);
  return { token: checkInToken(input.token) };
}

export const roadmapSlug = { params: params({ roadmapSlug: 'slug' }) };
export const roadmapBySlug = { params: params({ slug: 'slug' }) };
export const cycle = { params: params({ roadmapSlug: 'slug', cycleId: 'id' }) };
export const progressRead = roadmapSlug;
export const progressUpdate = { ...roadmapSlug, body: validateRoadmapProgressInput };
export const sessionCheckInDetails = { params: params({ sessionId: 'id' }), query: checkInQuery };
export const sessionCheckInSubmit = { params: params({ sessionId: 'id' }), body: checkInBody };
export const emptyAction = { params: params({ roadmapSlug: 'slug', cycleId: 'id' }), body: emptyBody };
export const roadmapCreate = { body: validateRoadmapInput };
export const roadmapUpdate = { params: params({ roadmapId: 'id' }), body: (value) => validateRoadmapInput(value, { partial: true }) };
export const roadmapNodes = { params: params({ roadmapId: 'id' }) };
export const roadmapNodeCreate = { params: params({ roadmapId: 'id' }), body: validateRoadmapNodeInput };
export const roadmapNodeUpdate = {
  params: params({ roadmapId: 'id', nodeId: 'id' }),
  body: (value) => validateRoadmapNodeInput(value, { partial: true }),
};
