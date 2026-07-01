/**
 * Sincroniza vínculos perfil_usuario para equipos interdisciplinarios.
 * Ejecutar: npx ts-node scripts/sync-perfil-equipo.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  vincularEquipoInstitucionAPerfil,
  vincularUsuarioAPerfil,
  vincularUsuarioAPerfilesInstitucion
} from '../src/utils/perfilAccess';

const prisma = new PrismaClient();

async function main() {
  const operativos = await prisma.usuario.findMany({
    where: {
      rol: { in: ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'] },
      institucion_id: { not: null }
    }
  });

  for (const u of operativos) {
    await vincularUsuarioAPerfilesInstitucion(u.id, u.institucion_id!, u.rol);
  }
  console.log(`Vínculos por institución: ${operativos.length} usuarios`);

  const perfiles = await prisma.perfil.findMany({ select: { id: true, institucion_id: true } });
  for (const p of perfiles) {
    await vincularEquipoInstitucionAPerfil(p.id, p.institucion_id);
  }
  console.log(`Equipo institucional vinculado en ${perfiles.length} perfiles`);

  const perfilMatias = await prisma.perfil.findFirst({
    where: {
      nombre: 'Matías Pérez',
      institucion: { tipo: 'FAMILIA' }
    }
  }) ?? await prisma.perfil.findFirst({
    where: { nombre: { contains: 'Matías', mode: 'insensitive' } },
    orderBy: { id: 'asc' }
  });

  if (perfilMatias) {
    const emails = [
      'familia@tealink.com',
      'medico@tealink.com',
      'profesional@tealink.com',
      'eduardoaltavida@email.com'
    ];
    for (const email of emails) {
      const u = await prisma.usuario.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });
      if (u) {
        await vincularUsuarioAPerfil(perfilMatias.id, u.id, u.rol);
        console.log(`  + ${u.rol} ${email} → perfil #${perfilMatias.id}`);
      }
    }
  }

  console.log('Sincronización completada.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
