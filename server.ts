import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { worker } from './src/server/worker';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserVaultConfig, upsertUserVaultConfig, getUserPositions, getUserTradeLogs } from './src/db/queries.ts';

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

  wss.on('error', (err) => {
    console.warn('[WS Server] Notice:', err?.message || err);
  });

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      engine: 'Rawsight Autonomous Multi-Chain Trading Worker v2.5',
      uptimeSeconds: process.uptime(),
      cloudSql: Boolean(process.env.SQL_HOST),
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

  // Authenticated Cloud SQL User & State APIs
  app.post('/api/user/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'user@rawsight.internal';
      const displayName = req.user?.name || '';
      if (!uid) {
        return res.status(400).json({ error: 'Missing UID in authenticated token' });
      }

      const user = await getOrCreateUser(uid, email, displayName);
      const config = await getUserVaultConfig(user.id);
      const positions = await getUserPositions(user.id);
      const logs = await getUserTradeLogs(user.id);

      res.json({
        user,
        config,
        positions,
        logs,
      });
    } catch (error: any) {
      console.error('Failed to sync user state with Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Internal database error' });
    }
  });

  app.post('/api/user/config', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'user@rawsight.internal';
      if (!uid) return res.status(400).json({ error: 'Missing UID' });

      const user = await getOrCreateUser(uid, email);
      const updated = await upsertUserVaultConfig(user.id, req.body);
      res.json({ success: true, config: updated });
    } catch (error: any) {
      console.error('Failed to update config in Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to update config' });
    }
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
