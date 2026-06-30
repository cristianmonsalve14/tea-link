import express, { Request, Response } from 'express';
import cors from 'cors';
import catalogosRoutes from './routes/catalogos';
import authRoutes from './routes/auth';
import observacionesRoutes from './routes/observaciones';
import perfilesRoutes from './routes/perfiles';
import reportesRoutes from './routes/reportes';

export function createApp() {
  const app = express();

  app.use(
    cors({
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
