import {
  PrismaClient,
  categoria_observacion_enum,
  privacidad_observacion_enum,
  rol_enum,
  tipo_institucion_enum,
  region_chile_enum
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { clearDemoDatabase } from '../src/utils/clearDemoDatabase';
import {
  vincularUsuarioAPerfil,
  vincularUsuarioAPerfilesInstitucion,
  vincularEquipoInstitucionAPerfil
} from '../src/utils/perfilAccess';
import { normalizarRutChileno } from '../src/utils/rutChileno';

const prisma = new PrismaClient();

const CONSENT_VERSION = '2026-02';

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function createInstitucion(
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
  return prisma.institucion.create({ data: { nombre, tipo, ...contacto } });
}

async function createUsuario(
  email: string,
  password: string,
  nombre_completo: string,
  rol: rol_enum,
  institucion_id: number,
  extra?: { consentimiento_aceptado_at?: Date; consentimiento_version?: string }
) {
  return prisma.usuario.create({
    data: {
      email,
      nombre_completo,
      rol,
      institucion_id,
      password_hash: await hash(password),
      ...extra
    }
  });
}

async function createPerfil(
  institucion_id: number,
  nombre: string,
  rut: string | null,
  opts?: {
    consentimiento_por_usuario_id?: number;
    consentimiento_estado?: 'ACEPTADO' | 'PENDIENTE';
  }
) {
  const rutNorm = rut ? normalizarRutChileno(rut) : null;
  if (rut && !rutNorm) throw new Error(`RUT inválido: ${rut}`);
  const aceptadoAt = opts?.consentimiento_estado === 'ACEPTADO' ? new Date() : null;
  return prisma.perfil.create({
    data: {
      nombre,
      rut: rutNorm,
      institucion_id,
      edad: 10,
      diagnostico_clinico: 'TEA',
      consentimiento_estado: opts?.consentimiento_estado ?? 'PENDIENTE',
      consentimiento_sujeto: 'TUTOR_LEGAL',
      consentimiento_aceptado_at: aceptadoAt,
      consentimiento_version: aceptadoAt ? CONSENT_VERSION : null,
      consentimiento_por_usuario_id: opts?.consentimiento_por_usuario_id ?? null
    }
  });
}

async function createObs(
  perfil_id: number,
  autor_id: number,
  titulo: string,
  categoria: categoria_observacion_enum,
  privacidad: privacidad_observacion_enum = 'PUBLICA'
) {
  return prisma.observacion.create({
    data: {
      perfil_id,
      autor_id,
      titulo,
      descripcion: `${titulo} (dato demo seed).`,
      categoria,
      privacidad,
      fecha_evento: new Date()
    }
  });
}

async function main() {
  console.log('Limpiando datos de demo (conserva catálogo MINEDUC/DEIS)...');
  await clearDemoDatabase(prisma);

  const sistema = await createInstitucion('Sistema TEA-LINK', 'SISTEMA');
  const famInst = await createInstitucion('Familia Pérez Demo', 'FAMILIA', {
    region: 'METROPOLITANA',
    comuna: 'Santiago',
    localidad: 'Santiago Centro'
  });
  const centroMedico = await createInstitucion('Centro Médico Integral Demo', 'CENTRO_MEDICO', {
    region: 'METROPOLITANA',
    comuna: 'Providencia',
    localidad: 'Los Leones',
    direccion: 'Los Leones 450, Providencia, Santiago',
    email_contacto: 'contacto@centromedico-demo.cl',
    telefono_contacto: '+56 2 2987 6543'
  });
  const colegioAltaVida = await createInstitucion('Colegio AltaVida', 'CENTRO_EDUCACIONAL', {
    region: 'METROPOLITANA',
    comuna: 'Maipú',
    localidad: 'Maipú',
    direccion: 'Av. Principal 100, Maipú, Santiago',
    email_contacto: 'contacto@colegioaltavida.cl',
    telefono_contacto: '+56 2 2555 0100'
  });
  const centroTerapeutico = await createInstitucion('Centro terapeutico', 'CENTRO_PROFESIONAL', {
    region: 'METROPOLITANA',
    comuna: 'Las Condes',
    localidad: 'Las Condes',
    email_contacto: 'contacto@centroterapeutico.cl'
  });

  const consentAt = new Date();

  const superadmin = await createUsuario(
    'cr.monsalveb@duocuc.cl',
    'SuperAdmin123!',
    'Super Administrador',
    'SUPERADMIN',
    sistema.id
  );

  await createUsuario(
    'admin.medico@tealink.com',
    'AdminMedico123!',
    'Administrador Centro Médico',
    'ADMINISTRADOR',
    centroMedico.id
  );
  await createUsuario(
    'directoraaltavida@email.com',
    'Directora123!',
    'Directora Colegio AltaVida',
    'ADMINISTRADOR',
    colegioAltaVida.id
  );
  await createUsuario(
    'centroterapeutico@email.com',
    'Adminterapeutico123!',
    'Administrador Centro Terapéutico',
    'ADMINISTRADOR',
    centroTerapeutico.id
  );

  const familiaUser = await createUsuario(
    'familia@tealink.com',
    'Familia123!',
    'María Pérez (madre)',
    'FAMILIA',
    famInst.id,
    { consentimiento_aceptado_at: consentAt, consentimiento_version: CONSENT_VERSION }
  );
  const medicoUser = await createUsuario(
    'medico@tealink.com',
    'Medico123!',
    'Dr. Roberto Fernández',
    'MEDICO',
    centroMedico.id
  );
  const profesionalUser = await createUsuario(
    'profesional@tealink.com',
    'Profesional123!',
    'Ana Martínez (terapeuta)',
    'PROFESIONAL',
    centroMedico.id
  );
  const eduardoUser = await createUsuario(
    'eduardoaltavida@email.com',
    'Eduardo123!',
    'Eduardo Altavida',
    'EDUCADOR',
    colegioAltaVida.id
  );
  const karlaUser = await createUsuario(
    'karlataiss@email.com',
    'Karla123!',
    'Karla Taiss',
    'EDUCADOR',
    colegioAltaVida.id
  );
  const educador1User = await createUsuario(
    'educador1@email.com',
    'Educador123!',
    'Educador Uno AltaVida',
    'EDUCADOR',
    colegioAltaVida.id
  );

  const perfilMatias = await createPerfil(colegioAltaVida.id, 'Matías Pérez', '11.111.111-1', {
    consentimiento_estado: 'ACEPTADO',
    consentimiento_por_usuario_id: familiaUser.id
  });
  const perfilClinico = await createPerfil(
    centroMedico.id,
    'Matías Pérez Clínico',
    '33.333.333-3',
    { consentimiento_estado: 'ACEPTADO', consentimiento_por_usuario_id: familiaUser.id }
  );
  const perfilJoaquin = await createPerfil(colegioAltaVida.id, 'Joaquin Sanchez', '22.222.222-2', {
    consentimiento_estado: 'ACEPTADO',
    consentimiento_por_usuario_id: familiaUser.id
  });

  await vincularUsuarioAPerfil(perfilMatias.id, familiaUser.id, 'FAMILIA', 'TUTOR', {
    puedeEditar: true
  });
  await prisma.perfilUsuario.update({
    where: {
      perfil_id_usuario_id: { perfil_id: perfilMatias.id, usuario_id: familiaUser.id }
    },
    data: { consentimiento_aceptado_at: consentAt }
  });

  for (const u of [medicoUser, profesionalUser, educador1User]) {
    await vincularUsuarioAPerfil(perfilMatias.id, u.id, u.rol);
  }
  for (const u of [medicoUser, profesionalUser]) {
    await vincularUsuarioAPerfil(perfilClinico.id, u.id, u.rol);
  }
  for (const u of [eduardoUser, karlaUser]) {
    await vincularUsuarioAPerfil(perfilJoaquin.id, u.id, u.rol);
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
  for (const p of [perfilMatias, perfilClinico, perfilJoaquin]) {
    await vincularEquipoInstitucionAPerfil(p.id, p.institucion_id);
  }

  // Observaciones demo (conteos según usuarios_prueba.md)
  for (let i = 1; i <= 4; i++) {
    await createObs(perfilMatias.id, familiaUser.id, `Seguimiento familia ${i}`, 'SOCIAL');
  }
  await createObs(perfilMatias.id, medicoUser.id, 'Evaluación clínica Matías', 'CLINICO');
  await createObs(perfilMatias.id, medicoUser.id, 'Control médico Matías', 'CLINICO', 'MULTINIVEL');
  await createObs(perfilMatias.id, profesionalUser.id, 'Sesión terapia Matías', 'COMUNICACION');

  await createObs(perfilClinico.id, medicoUser.id, 'Ficha clínica centro médico', 'CLINICO');
  await createObs(perfilClinico.id, profesionalUser.id, 'Informe terapéutico clínico', 'ACADEMICO');

  await createObs(perfilJoaquin.id, eduardoUser.id, 'Observación aula Joaquín', 'ACADEMICO');
  await createObs(perfilJoaquin.id, karlaUser.id, 'Observación convivencia Joaquín', 'CONDUCTA');

  console.log('\n--- Demo depurada cargada (usuarios_prueba.md) ---');
  console.log(`Superadmin:     cr.monsalveb@duocuc.cl / SuperAdmin123!`);
  console.log(`Familia:        familia@tealink.com / Familia123!`);
  console.log(`Educador Matías: educador1@email.com / Educador123!`);
  console.log(`Educador Joaquín: eduardoaltavida@email.com / Eduardo123!`);
  console.log(`Perfil principal: #${perfilMatias.id} Matías Pérez (Colegio AltaVida)`);
  console.log(`Instituciones: Sistema, Familia Pérez, Centro Médico, Colegio AltaVida, Centro terapeutico`);
  void superadmin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
