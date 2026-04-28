import app from '../src/app.js';
import { connectDatabase } from '../src/db.js';

const pathFromQuery = (value) => {
  if (Array.isArray(value)) return value.join('/');
  if (typeof value === 'string') return value;
  return '';
};

export const normalizeVercelUrl = (req) => {
  const originalUrl = req.url || '/';
  const parsedUrl = new URL(originalUrl, 'http://dira.local');
  const capturedPath = pathFromQuery(req.query?.path);

  if (capturedPath) {
    parsedUrl.searchParams.delete('path');

    const normalizedPath = capturedPath === 'docs' || capturedPath.startsWith('docs/')
      ? `/${capturedPath}`
      : `/v1/${capturedPath}`;
    const queryString = parsedUrl.searchParams.toString();

    return queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
  }

  if (originalUrl.startsWith('/api/docs')) {
    return originalUrl.replace(/^\/api\/docs/, '/docs') || '/docs';
  }

  if (originalUrl.startsWith('/api')) {
    return originalUrl.replace(/^\/api/, '/v1') || '/v1';
  }

  return '/v1';
};

export default async function handler(req, res) {
  req.url = normalizeVercelUrl(req);

  if (!req.url.startsWith('/docs')) {
    try {
      await connectDatabase();
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(503).json({
        message: 'Database connection failed',
      });
    }
  }

  return app(req, res);
}
