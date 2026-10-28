function validationError(error, part) {
  if (error?.status !== 400) return null;
  const messageField = error.message?.match(/^Unexpected field:\s+([^\s.]+)/)?.[1]
    || error.message?.match(/^([A-Za-z][A-Za-z0-9_.]*)\s+(?:must|is|required)\b/)?.[1];
  const field = typeof error.field === 'string' && error.field ? error.field : messageField || part;
  return { field, message: error.message || 'Invalid value.' };
}

export function validate(schema) {
  return function validateRequest(req, res, next) {
    const validated = {};
    for (const part of ['body', 'params', 'query']) {
      if (typeof schema[part] !== 'function') continue;
      try {
        validated[part] = schema[part](req[part]);
      } catch (error) {
        const detail = validationError(error, part);
        if (!detail) return next(error);
        return res.status(400).json({
          error: {
            message: 'Request validation failed.',
            fields: [detail],
          },
        });
      }
    }
    req.validated = validated;
    return next();
  };
}
