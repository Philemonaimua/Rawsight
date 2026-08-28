import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { worker } from './src/server/worker';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // Start 24/7 autonomous trading engine worker
  worker.start();

  // Setup WebSocket Server on top of HTTP server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    worker.registerClient(ws);
  });

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      engine: 'Rawsight Autonomous Multi-Chain Trading Worker v2.5',
      uptimeSeconds: process.uptime(),
    });
  });

  app.get('/api/state', (req, res) => {
    res.json(worker.getState());
  });

  app.post('/api/state/sync', (req, res) => {
    const { mode, data } = req.body;
    if (mode && data) {
      worker.syncFromClient(mode, data);
    }
    res.json({ success: true, timestamp: Date.now() });
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rawsight Full-Stack Terminal] Running on http://localhost:${PORT}`);
  });
}

startServer();
