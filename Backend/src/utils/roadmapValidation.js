import { generateSessionSchedule } from './roadmapSchedule.js';

function invalid(message, field) {
  throw Object.assign(new Error(message), { status: 400, field });
}

function objectInput(input, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid(`${label} must be a JSON object.`);
}

function rejectUnknown(input, allowed) {
  const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
  if (unexpected) invalid(`Unexpected field: ${unexpected}`, unexpected);
}

function text(value, field, max, { required = false } = {}) {
  if (typeof value !== 'string') invalid(`${field} must be text.`, field);
  const result = value.trim();
  if (required && !result) invalid(`${field} is required.`, field);
  if (result.length > max) invalid(`${field} must be ${max} characters or fewer.`, field);
  return result;
}

function textList(value, field, limit, maxLength) {
  if (!Array.isArray(value) || value.length > limit) invalid(`${field} must contain up to ${limit} items.`, field);
  return value.map((item, index) => text(item, `${field}.${index + 1}`, maxLength)).filter(Boolean);
}

function safeUrl(value, field) {
  const result = text(value, field, 500);
  if (!result) return '';
  let url;
  try {
    url = new URL(result);
  } catch {
    invalid(`${field} must be a valid HTTP or HTTPS URL.`, field);
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    invalid(`${field} must be a valid HTTP or HTTPS URL.`, field);
  }
  return url.toString();
}

function validateFields(input, fields, required) {
  for (const field of required) {
    if (!(field in input)) invalid(`${field} is required.`, field);
  }
  return fields.filter((field) => field in input);
}

export function validateRoadmapInput(input, { partial = false } = {}) {
  objectInput(input, 'Roadmap details');
  const fields = ['title', 'description', 'coverImageUrl', 'objectives', 'audience', 'prerequisites', 'status'];
  const required = partial ? [] : ['title', 'description'];
  const included = validateFields(input, fields, required);
  rejectUnknown(input, fields);
  const output = {};
  for (const field of included) {
    const value = input[field];
    if (field === 'objectives') output[field] = textList(value, field, 30, 160);
    else if (field === 'coverImageUrl') output[field] = safeUrl(value, field);
    else if (field === 'status') {
      if (!['draft', 'published', 'completed', 'archived'].includes(value)) invalid('status is not supported.', field);
      output[field] = value;
    } else output[field] = text(value, field, field === 'description' ? 5000 : field === 'prerequisites' ? 1000 : field === 'audience' ? 500 : 140, { required: ['title', 'description'].includes(field) });
  }
  return output;
}

const cycleFields = [
  'order', 'title', 'description', 'location', 'difficulty', 'objectives', 'prerequisites',
  'startDate', 'endDate', 'sessionsPerWeek', 'trainingDays', 'startTime',
  'sessionDurationMinutes', 'timeZone', 'registrationOpensAt',
  'registrationClosesAt', 'capacity', 'attendancePoints', 'status',
];

export function validateCycleInput(input, { partial = false } = {}) {
  objectInput(input, 'Cycle details');
  rejectUnknown(input, cycleFields);
  const required = partial ? [] : cycleFields.filter((field) => !['location', 'objectives', 'prerequisites', 'capacity', 'attendancePoints', 'status'].includes(field));
  const included = validateFields(input, cycleFields, required);
  const output = {};
  for (const field of included) {
    const value = input[field];
    if (['title', 'description', 'location', 'prerequisites', 'startDate', 'endDate', 'startTime', 'timeZone'].includes(field)) {
      output[field] = text(value, field, { title: 120, description: 3000, location: 200, prerequisites: 1000, startDate: 10, endDate: 10, startTime: 5, timeZone: 80 }[field], { required: ['title', 'description'].includes(field) });
    } else if (field === 'difficulty') {
      if (!['beginner', 'intermediate', 'advanced'].includes(value)) invalid('difficulty must be beginner, intermediate, or advanced.', field);
      output[field] = value;
    } else if (field === 'status') {
      if (!['draft', 'published', 'completed', 'cancelled', 'archived'].includes(value)) invalid('status is not supported.', field);
      output[field] = value;
    } else if (field === 'objectives') {
      output[field] = textList(value, field, 30, 160);
    } else if (field === 'trainingDays') {
      if (!Array.isArray(value) || value.length > 7 || value.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
        invalid('trainingDays must contain weekday numbers from 0 to 6.', field);
      }
      output[field] = value;
    } else if (field === 'registrationOpensAt' || field === 'registrationClosesAt') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) invalid(`${field} must be a valid date.`, field);
      output[field] = date;
    } else if (field === 'capacity') {
      if (value === null || value === '') output[field] = null;
      else if (!Number.isInteger(Number(value)) || Number(value) < 1) invalid('capacity must be a positive whole number or null.', field);
      else output[field] = Number(value);
    } else if (field === 'order') {
      if (!Number.isInteger(value) || value < 1) invalid('order must be a positive whole number.', field);
      output[field] = value;
    } else if (field === 'sessionsPerWeek') {
      if (!Number.isInteger(value) || value < 1 || value > 7) invalid('sessionsPerWeek must be a whole number from 1 to 7.', field);
      output[field] = value;
    } else if (field === 'sessionDurationMinutes') {
      if (!Number.isInteger(value) || value < 15 || value > 600) invalid('sessionDurationMinutes must be a whole number from 15 to 600.', field);
      output[field] = value;
    } else if (field === 'attendancePoints') {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) invalid('attendancePoints must be a non-negative number.', field);
      output[field] = Number(value);
    }
  }
  if ('registrationOpensAt' in output && 'registrationClosesAt' in output
    && output.registrationClosesAt < output.registrationOpensAt) {
    invalid('registrationClosesAt must be on or after registrationOpensAt.', 'registrationClosesAt');
  }
  if (!partial) {
    const sessions = generateSessionSchedule(output);
    if (output.registrationClosesAt >= sessions[0].startsAt) {
      invalid('registrationClosesAt must be before the first session starts.', 'registrationClosesAt');
    }
  }
  return output;
}

function validateResources(value, field) {
  if (!Array.isArray(value) || value.length > 30) invalid(`${field} must contain up to 30 items.`, field);
  return value.map((item, index) => {
    objectInput(item, `${field}.${index + 1}`);
    rejectUnknown(item, ['title', 'url']);
    if (!('title' in item) || !('url' in item)) invalid(`${field}.${index + 1} requires a title and URL.`, field);
    return { title: text(item.title, `${field}.${index + 1}.title`, 140, { required: true }), url: safeUrl(item.url, `${field}.${index + 1}.url`) };
  });
}

export function validateSessionInput(input) {
  objectInput(input, 'Session details');
  const fields = ['title', 'description', 'instructor', 'materials', 'problemSets', 'attendancePoints', 'status', 'startsAt', 'endsAt'];
  rejectUnknown(input, fields);
  const output = {};
  for (const field of fields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (field === 'title') output.title = text(value, field, 140, { required: true });
    else if (field === 'description') output.description = text(value, field, 3000);
    else if (field === 'instructor') output.instructor = text(value, field, 120);
    else if (field === 'materials' || field === 'problemSets') output[field] = validateResources(value, field);
    else if (field === 'attendancePoints') {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) invalid('attendancePoints must be a non-negative number.', field);
      output[field] = Number(value);
    } else if (field === 'status') {
      if (!['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(value)) invalid('status is not supported.', field);
      output[field] = value;
    } else {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) invalid(`${field} must be a valid date.`, field);
      output[field] = date;
    }
  }
  if (output.startsAt && output.endsAt && output.endsAt <= output.startsAt) invalid('endsAt must be after startsAt.', 'endsAt');
  return output;
}
