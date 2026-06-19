/**
 * Elimina un usuario por email (y observaciones/reportes asociados).
 * Uso: npx ts-node scripts/purge-user-by-email.ts educador1@email.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailArg = process.argv[2];

async function purgeUser(userId: number) {
  await prisma.$transaction(async tx => {
    const observacionIds = await tx.observacion.findMany({
      where: { autor_id: userId },
      select: { id: true }
    });
    if (observacionIds.length > 0) {
      await tx.observacionEnReporte.deleteMany({
        where: { observacion_id: { in: observacionIds.map(o => o.id) } }
      });
      await tx.observacion.deleteMany({ where: { autor_id: userId } });
    }

    const reporteIds = await tx.reporte.findMany({
      where: { creador_id: userId },
      select: { id: true }
    });
    if (reporteIds.length > 0) {
      await tx.observacionEnReporte.deleteMany({
        where: { reporte_id: { in: reporteIds.map(r => r.id) } }
      });
      await tx.reporte.deleteMany({ where: { creador_id: userId } });
    }

    await tx.perfilUsuario.deleteMany({ where: { usuario_id: userId } });
    await tx.usuario.delete({ where: { id: userId } });
  });
}

async function main() {
  if (!emailArg) {
    console.error('Uso: npx ts-node scripts/purge-user-by-email.ts <email>');
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const user = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  if (!user) {
    console.log('No hay usuario con ese correo.');
    return;
  }
  console.log(`Eliminando id=${user.id} email=${user.email} rol=${user.rol} institucion_id=${user.institucion_id}`);
  await purgeUser(user.id);
  console.log('Usuario eliminado.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
