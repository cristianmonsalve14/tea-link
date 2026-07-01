import express, { Request, Response } from 'express';
import cors from 'cors';
import catalogosRoutes from './routes/catalogos';
import authRoutes from './routes/auth';
import observacionesRoutes from './routes/observaciones';
import perfilesRoutes from './routes/perfiles';
import reportesRoutes from './routes/reportes';

function parseCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  if (raw === '*') return true;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();
  const origins = parseCorsOrigins();

  app.use(
    cors({
      origin: origins,
      exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
    })
  );
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/catalogos', catalogosRoutes);
  app.use('/api/observaciones', observacionesRoutes);
  app.use('/api/perfiles', perfilesRoutes);
  app.use('/api/reportes', reportesRoutes);

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'TEA Link Backend - API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', uptime: process.uptime() });
  });

  return app;
}

