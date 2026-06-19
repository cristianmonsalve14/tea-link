import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({ orderBy: { id: 'asc' } });
  const obs = await prisma.observacion.findMany({
    include: {
      autor: { select: { id: true, email: true, rol: true } },
      perfil: { select: { id: true, nombre: true } }
    },
    orderBy: { id: 'asc' }
  });
  const vinculos = await prisma.perfilUsuario.findMany({
    include: {
      usuario: { select: { email: true, rol: true } },
      perfil: { select: { id: true, nombre: true } }
    }
  });
  const perfiles = await prisma.perfil.findMany({
    include: { institucion: { select: { nombre: true } } }
  });

  const obsByAuthor = new Map<string, typeof obs>();
  for (const o of obs) {
    const e = o.autor.email;
    if (!obsByAuthor.has(e)) obsByAuthor.set(e, []);
    obsByAuthor.get(e)!.push(o);
  }

  const vincByUser = new Map<string, string[]>();
  for (const v of vinculos) {
    const e = v.usuario.email;
    if (!vincByUser.has(e)) vincByUser.set(e, []);
    vincByUser.get(e)!.push(`#${v.perfil.id} ${v.perfil.nombre}`);
  }

  console.log('\n=== OBSERVACIONES POR AUTOR ===');
  for (const [email, list] of obsByAuthor) {
    console.log(
      `${email}: ${list.length} → ${list.map(o => `[${o.id}] ${o.titulo.slice(0, 35)} (${o.perfil.nombre})`).join(' | ')}`
    );
  }

  console.log('\n=== TODOS LOS USUARIOS ===');
  for (const u of users) {
    const v = vincByUser.get(u.email) ?? [];
    const count = obsByAuthor.get(u.email)?.length ?? 0;
    let estado = 'SIN ACTIVIDAD';
    if (count > 0 && v.length > 0) estado = 'ACTIVO (obs + vínculo)';
    else if (count > 0) estado = 'CREA OBS (sin vínculo perfil_usuario)';
    else if (v.length > 0) estado = 'VINCULADO (sin obs propias)';
    else if (u.rol === 'ADMINISTRADOR' || u.rol === 'SUPERADMIN') estado = 'GESTIÓN (no bitácora)';

    console.log(`${u.email} | ${u.rol} | vínculos: ${v.length}${v.length ? ' [' + v.join('; ') + ']' : ''} | obs: ${count} | ${estado}`);
  }

  console.log('\n=== PERFILES — OBSERVACIONES ===');
  for (const pf of perfiles) {
    const n = obs.filter(o => o.perfil_id === pf.id).length;
    const autores = [...new Set(obs.filter(o => o.perfil_id === pf.id).map(o => o.autor.email))];
    console.log(`#${pf.id} ${pf.nombre}: ${n} obs | autores: ${autores.join(', ') || 'ninguno'}`);
  }

  console.log('\nTotal observaciones:', obs.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
