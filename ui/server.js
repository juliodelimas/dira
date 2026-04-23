import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:3000';

app.use(createProxyMiddleware({
  pathFilter: '/api',
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/v1' },
}));

app.use(express.static(join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dira UI running at http://localhost:${PORT}`);
  console.log(`Proxying API requests to ${API_URL}/v1`);
});
