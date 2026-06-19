import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inst = await prisma.institucion.findMany({ orderBy: { id: 'asc' } });
  const users = await prisma.usuario.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      nombre_completo: true,
      rol: true,
      institucion_id: true,
      must_change_password: true
    }
  });
  const perfiles = await prisma.perfil.findMany({
    include: { institucion: { select: { id: true, nombre: true, tipo: true } } }
  });
  const vinculos = await prisma.perfilUsuario.findMany({
    include: {
      usuario: { select: { email: true, rol: true } },
      perfil: { select: { id: true, nombre: true } }
    }
  });

  console.log('\n=== INSTITUCIONES ===');
  for (const i of inst) {
    console.log(`  [${i.id}] ${i.nombre} (${i.tipo})`);
  }

  console.log('\n=== USUARIOS ===');
  for (const u of users) {
    const i = inst.find(x => x.id === u.institucion_id);
    console.log(
      `  [${u.id}] ${u.email} | ${u.rol} | ${u.nombre_completo} | inst: ${i?.nombre ?? 'SIN INSTITUCIÓN'} (${u.institucion_id ?? 'null'})${u.must_change_password ? ' | DEBE CAMBIAR CLAVE' : ''}`
    );
  }

  console.log('\n=== PERFILES (estudiantes) ===');
  for (const p of perfiles) {
    console.log(`  [${p.id}] ${p.nombre} → ${p.institucion.nombre} (${p.institucion.tipo})`);
  }

  console.log('\n=== EQUIPO POR PERFIL (perfil_usuario) ===');
  const byPerfil = new Map<number, typeof vinculos>();
  for (const v of vinculos) {
    if (!byPerfil.has(v.perfil_id)) byPerfil.set(v.perfil_id, []);
    byPerfil.get(v.perfil_id)!.push(v);
  }
  for (const [pid, list] of byPerfil) {
    const nombre = list[0]?.perfil.nombre ?? '?';
    console.log(`  Perfil #${pid} "${nombre}":`);
    for (const v of list) {
      console.log(`    - ${v.usuario.rol}: ${v.usuario.email}`);
    }
  }
  console.log('\n=== TOTAL USUARIOS:', users.length, '===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
