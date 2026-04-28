import app from '../src/app.js';
import { connectDatabase } from '../src/db.js';

export default async function handler(req, res) {
  const originalUrl = req.url || '/';
  if (originalUrl.startsWith('/api/docs')) {
    req.url = originalUrl.replace(/^\/api\/docs/, '/docs') || '/docs';
  } else {
    await connectDatabase();
    req.url = originalUrl.replace(/^\/api/, '/v1') || '/v1';
  }

  return app(req, res);
}
