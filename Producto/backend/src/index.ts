import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (exponer headers para que el frontend lea tipo/nombre al descargar)
app.use(
  cors({
    exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
  })
);
app.use(express.json());


// Rutas de autenticación
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// Rutas de observaciones
import observacionesRoutes from './routes/observaciones';
app.use('/api/observaciones', observacionesRoutes);

// Rutas de perfiles
import perfilesRoutes from './routes/perfiles';
app.use('/api/perfiles', perfilesRoutes);

// Rutas de reportes
import reportesRoutes from './routes/reportes';
app.use('/api/reportes', reportesRoutes);

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🚀 TEA Link Backend - API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Iniciar servidor (solo un mensaje de éxito cuando el puerto quedó libre)
const server = app.listen(PORT);

server.once('listening', () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('📄 Export PDF: pdfkit activo en GET /api/reportes/:id/export');
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} en uso. Ejecute: npm run dev:kill-port`);
    console.error('   Luego: npm run dev');
    process.exit(1);
  }
  throw err;
});
