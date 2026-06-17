/**
 * Shared CORS origin policy for Express and Socket.io.
 * Supports FRONTEND_URL, comma-separated FRONTEND_URLS, localhost, and *.vercel.app.
 */

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

const VERCEL_ORIGIN_PATTERN = /^https:\/\/[\w.-]+\.vercel\.app$/;

const parseEnvOrigins = () => {
  const values = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS].filter(Boolean);

  return values
    .flatMap((value) => value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getAllowedOrigins = () => [...new Set([...LOCAL_ORIGINS, ...parseEnvOrigins()])];

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (getAllowedOrigins().includes(origin)) {
    return true;
  }

  if (VERCEL_ORIGIN_PATTERN.test(origin)) {
    return true;
  }

  return false;
};

const corsOriginCallback = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked origin: ${origin}`));
  }
};

const socketCorsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked origin: ${origin}`));
  }
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  corsOriginCallback,
  socketCorsOrigin,
};
