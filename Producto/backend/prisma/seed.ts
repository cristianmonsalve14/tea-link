import { PrismaClient, rol_enum, tipo_institucion_enum } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  vincularUsuarioAPerfil,
  vincularUsuarioAPerfilesInstitucion
} from '../src/utils/perfilAccess';

const prisma = new PrismaClient();

const PASSWORD_DEFAULT = 'Demo123!';

async function upsertInstitucion(nombre: string, tipo: tipo_institucion_enum) {
  const existing = await prisma.institucion.findFirst({ where: { nombre, tipo } });
  if (existing) return existing;
  return prisma.institucion.create({ data: { nombre, tipo } });
}

async function upsertUsuario(
  email: string,
  password: string,
  nombre_completo: string,
  rol: rol_enum,
  institucion_id: number
) {
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuario ya existe: ${email}`);
    return existing;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.usuario.create({
    data: {
      email,
      nombre_completo,
      rol,
      password_hash,
      institucion_id
    }
  });
  console.log(`Usuario creado: ${email} (${rol})`);
  return user;
}

async function upsertPerfil(institucion_id: number, nombre: string, diagnostico?: string) {
  const existing = await prisma.perfil.findFirst({
    where: { institucion_id, nombre }
  });
  if (existing) return existing;
  const perfil = await prisma.perfil.create({
    data: {
      nombre,
      institucion_id,
      edad: 10,
      diagnostico: diagnostico ?? 'TEA — seguimiento demo'
    }
  });
  console.log(`Perfil creado: ${nombre} (institución ${institucion_id})`);
  return perfil;
}

async function main() {
  let sistema = await prisma.institucion.findFirst({
    where: { tipo: 'SISTEMA' }
  });
  if (!sistema) {
    sistema = await prisma.institucion.create({
      data: { nombre: 'Sistema TEA-LINK', tipo: 'SISTEMA' }
    });
    console.log('Institución SISTEMA creada');
  }

  await upsertUsuario(
    'cr.monsalveb@duocuc.cl',
    'SuperAdmin123!',
    'Super Administrador',
    'SUPERADMIN',
    sistema.id
  );

  // —— Colegio (educador) ——
  const colegio = await upsertInstitucion('Colegio Aurora Demo', 'CENTRO_EDUCACIONAL');
  await upsertUsuario(
    'admin.colegio@tealink.com',
    'AdminColegio123!',
    'Administrador Colegio Demo',
    'ADMINISTRADOR',
    colegio.id
  );
  await upsertUsuario(
    'educador2@tealink.com',
    'Educador123!',
    'Educador Prueba',
    'EDUCADOR',
    colegio.id
  );
  const perfilColegio = await upsertPerfil(colegio.id, 'Matías Pérez Demo');

  // —— Familia ——
  const famInst = await upsertInstitucion('Familia Pérez Demo', 'FAMILIA');
  await upsertUsuario(
    'admin.familia@tealink.com',
    'AdminFamilia123!',
    'Administrador Familia',
    'ADMINISTRADOR',
    famInst.id
  );
  const familiaUser = await upsertUsuario(
    'familia@tealink.com',
    'Familia123!',
    'María Pérez (madre)',
    'FAMILIA',
    famInst.id
  );
  const perfilMatias = await upsertPerfil(famInst.id, 'Matías Pérez', 'TEA — seguimiento familiar');

  // —— Centro médico (médico + profesional) ——
  const centroMedico = await upsertInstitucion('Centro Médico Integral Demo', 'CENTRO_MEDICO');
  await upsertUsuario(
    'admin.medico@tealink.com',
    'AdminMedico123!',
    'Administrador Centro Médico',
    'ADMINISTRADOR',
    centroMedico.id
  );
  const medicoUser = await upsertUsuario(
    'medico@tealink.com',
    'Medico123!',
    'Dr. Roberto Fernández',
    'MEDICO',
    centroMedico.id
  );
  const profesionalUser = await upsertUsuario(
    'profesional@tealink.com',
    'Profesional123!',
    'Ana Martínez (terapeuta)',
    'PROFESIONAL',
    centroMedico.id
  );
  await upsertPerfil(centroMedico.id, 'Matías Pérez Clínico', 'TEA — control médico');

  // —— Centro profesional ——
  const centroProf = await upsertInstitucion('Centro Terapéutico Esperanza Demo', 'CENTRO_PROFESIONAL');
  await upsertUsuario(
    'admin.profesional@tealink.com',
    'AdminProf123!',
    'Administrador Centro Terapéutico',
    'ADMINISTRADOR',
    centroProf.id
  );
  await upsertUsuario(
    'profesional.ct@tealink.com',
    'Profesional123!',
    'Carlos Soto (fonoaudiólogo)',
    'PROFESIONAL',
    centroProf.id
  );
  await upsertPerfil(centroProf.id, 'Sofía López Demo', 'TEA — intervención terapéutica');

  const educadorUser = await prisma.usuario.findUnique({
    where: { email: 'educador2@tealink.com' }
  });

  // Equipo interdisciplinario sobre Matías Pérez (mismo estudiante, distintos roles)
  const equipoDemo = [familiaUser, medicoUser, profesionalUser, educadorUser].filter(Boolean) as {
    id: number;
    rol: rol_enum;
  }[];
  for (const miembro of equipoDemo) {
    await vincularUsuarioAPerfil(perfilMatias.id, miembro.id, miembro.rol);
  }
  if (perfilColegio && educadorUser) {
    await vincularUsuarioAPerfil(perfilColegio.id, educadorUser.id, 'EDUCADOR');
  }

  const operativos = await prisma.usuario.findMany({
    where: {
      rol: { in: ['FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO'] },
      institucion_id: { not: null }
    }
  });
  for (const u of operativos) {
    await vincularUsuarioAPerfilesInstitucion(u.id, u.institucion_id!, u.rol);
  }

  console.log('\n--- Usuarios demo listos para probar interfaces ---');
  console.log('FAMILIA:      familia@tealink.com / Familia123!');
  console.log('PROFESIONAL:  profesional@tealink.com / Profesional123!  (centro médico)');
  console.log('PROFESIONAL:  profesional.ct@tealink.com / Profesional123! (centro terapéutico)');
  console.log('MEDICO:       medico@tealink.com / Medico123!');
  console.log('EDUCADOR:     educador2@tealink.com / Educador123!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
