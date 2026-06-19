/**
 * Elimina usuarios de prueba antiguos y limpia instituciones huérfanas.
 * Uso: npx ts-node scripts/purge-legacy-users.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_EMAILS = [
  'medico@email.com',
  'profesional@email.com',
  'poly@gmail.com',
  'jose@email.com'
];

const LEGACY_INSTITUCION_IDS = [5, 6, 9]; // centro medico/prueba viejo, colegio viejo

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

    await tx.auditoriaAdmin.deleteMany({ where: { admin_id: userId } });
    await tx.perfilUsuario.deleteMany({ where: { usuario_id: userId } });
    await tx.usuario.delete({ where: { id: userId } });
  });
}

async function main() {
  console.log('=== Eliminando usuarios legacy ===\n');

  for (const email of LEGACY_EMAILS) {
    const user = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (!user) {
      console.log(`  (omitido) ${email} — no existe`);
      continue;
    }
    const obs = await prisma.observacion.count({ where: { autor_id: user.id } });
    const rep = await prisma.reporte.count({ where: { creador_id: user.id } });
    console.log(
      `  Eliminando ${user.email} (id=${user.id}, ${user.rol}) — ${obs} obs, ${rep} reportes`
    );
    await purgeUser(user.id);
    console.log(`  ✓ ${user.email} eliminado`);
  }

  console.log('\n=== Limpiando perfiles de instituciones viejas ===\n');
  for (const instId of LEGACY_INSTITUCION_IDS) {
    const perfiles = await prisma.perfil.findMany({ where: { institucion_id: instId } });
    for (const perfil of perfiles) {
      const obsCount = await prisma.observacion.count({ where: { perfil_id: perfil.id } });
      await prisma.observacionEnReporte.deleteMany({
        where: { observacion: { perfil_id: perfil.id } }
      });
      await prisma.observacion.deleteMany({ where: { perfil_id: perfil.id } });
      await prisma.perfilUsuario.deleteMany({ where: { perfil_id: perfil.id } });
      await prisma.perfil.delete({ where: { id: perfil.id } });
      console.log(`  ✓ Perfil #${perfil.id} "${perfil.nombre}" (${obsCount} obs eliminadas)`);
    }
  }

  console.log('\n=== Eliminando instituciones viejas sin usuarios ===\n');
  for (const instId of LEGACY_INSTITUCION_IDS) {
    const inst = await prisma.institucion.findUnique({ where: { id: instId } });
    if (!inst) continue;
    const users = await prisma.usuario.count({ where: { institucion_id: instId } });
    const perfiles = await prisma.perfil.count({ where: { institucion_id: instId } });
    if (users === 0 && perfiles === 0) {
      await prisma.institucion.delete({ where: { id: instId } });
      console.log(`  ✓ Institución #${instId} "${inst.nombre}" eliminada`);
    } else {
      console.log(
        `  (omitida) #${instId} "${inst.nombre}" — aún tiene ${users} usuarios, ${perfiles} perfiles`
      );
    }
  }

  const total = await prisma.usuario.count();
  console.log(`\n=== Listo. Usuarios restantes: ${total} ===`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
