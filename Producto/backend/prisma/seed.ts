import { PrismaClient, rol_enum, tipo_institucion_enum, region_chile_enum } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  vincularUsuarioAPerfil,
  vincularUsuarioAPerfilesInstitucion
} from '../src/utils/perfilAccess';
import { normalizarRutChileno } from '../src/utils/rutChileno';

const prisma = new PrismaClient();

const PASSWORD_DEFAULT = 'Demo123!';

async function upsertInstitucion(
  nombre: string,
  tipo: tipo_institucion_enum,
  contacto?: {
    region?: region_chile_enum;
    comuna?: string;
    localidad?: string;
    direccion?: string;
    email_contacto?: string;
    telefono_contacto?: string;
  }
) {
  const existing = await prisma.institucion.findFirst({ where: { nombre, tipo } });
  if (existing) {
    if (contacto) {
      return prisma.institucion.update({ where: { id: existing.id }, data: contacto });
    }
    return existing;
  }
  return prisma.institucion.create({ data: { nombre, tipo, ...contacto } });
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

async function upsertPerfil(
  institucion_id: number,
  nombre: string,
  rut: string,
  diagnostico_clinico: 'TEA' | 'TDAH' = 'TEA'
) {
  const rutNorm = normalizarRutChileno(rut);
  if (!rutNorm) throw new Error(`RUT inválido en seed: ${rut}`);
  const existing = await prisma.perfil.findFirst({
    where: { OR: [{ rut: rutNorm }, { institucion_id, nombre }] }
  });
  if (existing) return existing;
  const perfil = await prisma.perfil.create({
    data: {
      nombre,
      rut: rutNorm,
      institucion_id,
      edad: 10,
      diagnostico_clinico
    }
  });
  console.log(`Perfil creado: ${nombre} (RUT ${rutNorm}, institución ${institucion_id})`);
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
  const colegio = await upsertInstitucion('Colegio Aurora Demo', 'CENTRO_EDUCACIONAL', {
    region: 'METROPOLITANA',
    comuna: 'Providencia',
    localidad: 'Providencia',
    direccion: 'Av. Providencia 1200, Providencia, Santiago',
    email_contacto: 'contacto@colegioaurora-demo.cl',
    telefono_contacto: '+56 2 2345 6789'
  });
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
  const perfilMatias = await upsertPerfil(colegio.id, 'Matías Pérez', '11.111.111-1');

  // —— Tutor familia (sin panel admin; invitado por el colegio) ——
  const famInst = await upsertInstitucion('Familia Pérez Demo', 'FAMILIA', {
    region: 'METROPOLITANA',
    comuna: 'Santiago',
    localidad: 'Santiago Centro'
  });
  const familiaUser = await upsertUsuario(
    'familia@tealink.com',
    'Familia123!',
    'María Pérez (madre)',
    'FAMILIA',
    famInst.id
  );

  const aceptadoAt = new Date();
  await prisma.perfil.update({
    where: { id: perfilMatias.id },
    data: {
      consentimiento_estado: 'ACEPTADO',
      consentimiento_sujeto: 'TUTOR_LEGAL',
      consentimiento_aceptado_at: aceptadoAt,
      consentimiento_version: '2026-02',
      consentimiento_por_usuario_id: familiaUser.id
    }
  });
  await vincularUsuarioAPerfil(perfilMatias.id, familiaUser.id, 'FAMILIA', 'TUTOR', {
    puedeEditar: true
  });
  await prisma.perfilUsuario.update({
    where: {
      perfil_id_usuario_id: { perfil_id: perfilMatias.id, usuario_id: familiaUser.id }
    },
    data: { consentimiento_aceptado_at: aceptadoAt }
  });

  // —— Centro médico (médico + profesional) ——
  const centroMedico = await upsertInstitucion('Centro Médico Integral Demo', 'CENTRO_MEDICO', {
    region: 'METROPOLITANA',
    comuna: 'Providencia',
    localidad: 'Los Leones',
    direccion: 'Los Leones 450, Providencia, Santiago',
    email_contacto: 'contacto@centromedico-demo.cl',
    telefono_contacto: '+56 2 2987 6543'
  });
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
  await upsertPerfil(centroMedico.id, 'Matías Pérez Clínico', '33.333.333-3');

  // —— Centro profesional ——
  const centroProf = await upsertInstitucion('Centro Terapéutico Esperanza Demo', 'CENTRO_PROFESIONAL', {
    region: 'METROPOLITANA',
    comuna: 'Las Condes',
    localidad: 'Apoquindo',
    direccion: 'Av. Apoquindo 3000, Las Condes, Santiago',
    email_contacto: 'contacto@esperanza-terapia.cl',
    telefono_contacto: '+56 2 2123 4567'
  });
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
  await upsertPerfil(centroProf.id, 'Sofía López Demo', '44.444.444-4');

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
