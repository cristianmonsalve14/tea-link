import dotenv from 'dotenv';
import { Server } from 'http';
import { createApp } from './app';

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT || 3000);

let server: Server;

function startServer() {
  server = app.listen(PORT);

  server.once('listening', () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('📄 Export PDF: pdfkit activo en GET /api/reportes/:id/export');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${PORT} en uso. Cierre otras instancias de "npm run dev" y ejecute:`);
      console.error('   npm run dev:kill-port');
      console.error('   npm run dev');
      process.exit(1);
    }
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  });
}

function shutdown(signal: string) {
  if (!server) {
    process.exit(0);
    return;
  }
  console.log(`\n⏹️  ${signal} recibido — cerrando servidor...`);
  server.close(err => {
    if (err) {
      console.error('Error al cerrar el servidor:', err);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forzando cierre del servidor (timeout).');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
