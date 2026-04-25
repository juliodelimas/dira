import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import boardRoutes from './routes/boards.routes.js';
import statusRoutes from './routes/statuses.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import subtaskRoutes from './routes/subtasks.routes.js';
import commentRoutes from './routes/comments.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = yaml.load(readFileSync(resolve(__dirname, '../swagger.yaml'), 'utf8'));

const app = express();

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/v1', authRoutes);
app.use('/v1', userRoutes);
app.use('/v1', boardRoutes);
app.use('/v1', statusRoutes);
app.use('/v1', taskRoutes);
app.use('/v1', subtaskRoutes);
app.use('/v1', commentRoutes);

app.use(errorHandler);

export default app;
