import mongoose from 'mongoose';

export function invalid(message, field) {
  throw Object.assign(new Error(message), { status: 400, field });
}

export function object(value, label, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${label} must be a JSON object.`, label);
  const unexpected = Object.keys(value).find((key) => !fields.includes(key));
  if (unexpected) invalid(`Unexpected field: ${unexpected}`, unexpected);
  return value;
}

export function bodyObject(fields, label, { allowEmpty = false } = {}) {
  return (value) => {
    const input = value === undefined && allowEmpty ? {} : value;
    const result = object(input, label, fields);
    if (!allowEmpty && Object.keys(result).length === 0) invalid(`${label} must not be empty.`, label);
    return result;
  };
}

export function params(fields) {
  return (value) => {
    const names = Object.keys(fields);
    const input = object(value, 'params', names);
    const output = {};
    for (const [field, type] of Object.entries(fields)) {
      const current = input[field];
      if (typeof current !== 'string' || !current) invalid(`${field} is required.`, field);
      if (type === 'id' && !mongoose.isValidObjectId(current)) invalid(`${field} must be a valid identifier.`, field);
      if (type === 'username' && !/^[a-z0-9_]{3,20}$/i.test(current)) invalid(`${field} must be a valid username.`, field);
      if (type === 'slug' && (current.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(current))) invalid(`${field} must be a valid slug.`, field);
      output[field] = current;
    }
    return output;
  };
}

export function emptyBody(value) {
  const input = value === undefined ? {} : value;
  return object(input, 'body', []);
}

export function checkInToken(value, field = 'token', { required = true } = {}) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) invalid(`${field} must be a valid check-in token.`, field);
  return value;
}

export function optionalString(value, field, { maxLength = 500, required = false, trim = true } = {}) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string') invalid(`${field} must be text.`, field);
  const result = trim ? value.trim() : value;
  if (required && !result) invalid(`${field} is required.`, field);
  if (result.length > maxLength) invalid(`${field} must be ${maxLength} characters or fewer.`, field);
  return result;
}
