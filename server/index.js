import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodesRouter from './routes/nodes.js';
import statusRouter from './routes/status.js';
import childrenRouter from './routes/children.js';
import dependenciesRouter from './routes/dependencies.js';
import chatRouter from './routes/chat.js';
import projectsRouter from './routes/projects.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', projectsRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/nodes', statusRouter);
app.use('/api/nodes', childrenRouter);
app.use('/api/nodes', dependenciesRouter);
app.use('/api/nodes', chatRouter);

// Serve static files (Vite build output)
const distPath = join(__dirname, '../dist/public');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Atlas server running on port ${PORT}`);
});
