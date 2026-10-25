import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters.');
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured.');
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export function isAllowedClientOrigin(origin) {
  if (typeof origin !== 'string') return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    if (url.origin === new URL(config.clientOrigin).origin) return true;
    return url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}
