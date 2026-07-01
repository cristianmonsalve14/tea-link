/**
 * Seed aislado para pruebas de integración.
 * Solo crea/elimina datos con emails @test-auto.tealink.cl e instituciones [TEST]*.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { vincularUsuarioAPerfil } from '../src/utils/perfilAccess';

const prisma = new PrismaClient();

const TEST_EMAIL_DOMAIN = '@test-auto.tealink.cl';

export const TEST_PASSWORDS = {
  superadmin: 'TestSuper123!',
  admin: 'TestAdmin123!',
  familia: 'TestFamilia123!',
  medico: 'TestMedico123!',
  profesional: 'TestProf123!',
  educador: 'TestEducador123!'
} as const;

export const TEST_EMAILS = {
  superadmin: `superadmin${TEST_EMAIL_DOMAIN}`,
  admin: `admin${TEST_EMAIL_DOMAIN}`,
  familia: `familia${TEST_EMAIL_DOMAIN}`,
  medico: `medico${TEST_EMAIL_DOMAIN}`,
  profesional: `profesional${TEST_EMAIL_DOMAIN}`,
  educador: `educador${TEST_EMAIL_DOMAIN}`
} as const;

export type TestFixture = {
  institucionSistemaId: number;
  institucionColegioId: number;
  institucionCentroMedicoId: number;
  perfilId: number;
  obsPublicaId: number;
  obsPrivadaId: number;
  obsMultinivelId: number;
};

let cachedFixture: TestFixture | null = null;

export async function deleteTestData(client?: PrismaClient) {
  const db = client ?? prisma;
  const testUsers = await db.usuario.findMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
    select: { id: true }
  });
  const testUserIds = testUsers.map(u => u.id);

  if (testUserIds.length > 0) {
    await db.observacion.deleteMany({ where: { autor_id: { in: testUserIds } } });
    await db.auditoriaObservacion.deleteMany({ where: { usuario_id: { in: testUserIds } } });
    await db.auditoriaAdmin.deleteMany({ where: { admin_id: { in: testUserIds } } });
    await db.perfilUsuario.deleteMany({ where: { usuario_id: { in: testUserIds } } });
    await db.usuario.deleteMany({ where: { id: { in: testUserIds } } });
  }

  await db.observacion.deleteMany({
    where: { perfil: { nombre: { startsWith: '[TEST]' } } }
  });
  await db.perfilUsuario.deleteMany({
    where: { perfil: { nombre: { startsWith: '[TEST]' } } }
  });
  await db.perfil.deleteMany({ where: { nombre: { startsWith: '[TEST]' } } });
  await db.institucion.deleteMany({ where: { nombre: { startsWith: '[TEST]' } } });
}

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

export async function seedTestDatabase(): Promise<TestFixture> {
  await deleteTestData();

  const sistema = await prisma.institucion.create({
    data: { nombre: '[TEST] Sistema', tipo: 'SISTEMA' }
  });

  const instColegio = await prisma.institucion.create({
    data: {
      nombre: '[TEST] Colegio Demo',
      tipo: 'CENTRO_EDUCACIONAL',
      region: 'METROPOLITANA',
      comuna: 'Providencia',
      localidad: 'Santiago'
    }
  });

  const instCentroMedico = await prisma.institucion.create({
    data: {
      nombre: '[TEST] Centro Médico',
      tipo: 'CENTRO_MEDICO',
      region: 'METROPOLITANA',
      comuna: 'Providencia',
      localidad: 'Santiago'
    }
  });

  const superadmin = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.superadmin,
      nombre_completo: 'Super Test',
      rol: 'SUPERADMIN',
      institucion_id: sistema.id,
      password_hash: await hash(TEST_PASSWORDS.superadmin)
    }
  });

  const admin = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.admin,
      nombre_completo: 'Admin Test',
      rol: 'ADMINISTRADOR',
      institucion_id: instColegio.id,
      password_hash: await hash(TEST_PASSWORDS.admin)
    }
  });

  const familia = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.familia,
      nombre_completo: 'Familia Test',
      rol: 'FAMILIA',
      institucion_id: null,
      password_hash: await hash(TEST_PASSWORDS.familia)
    }
  });

  const medico = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.medico,
      nombre_completo: 'Medico Test',
      rol: 'MEDICO',
      institucion_id: instCentroMedico.id,
      password_hash: await hash(TEST_PASSWORDS.medico)
    }
  });

  const profesional = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.profesional,
      nombre_completo: 'Profesional Test',
      rol: 'PROFESIONAL',
      institucion_id: instCentroMedico.id,
      password_hash: await hash(TEST_PASSWORDS.profesional)
    }
  });

  const educador = await prisma.usuario.create({
    data: {
      email: TEST_EMAILS.educador,
      nombre_completo: 'Educador Test',
      rol: 'EDUCADOR',
      institucion_id: instColegio.id,
      password_hash: await hash(TEST_PASSWORDS.educador)
    }
  });

  const aceptadoAt = new Date();
  const perfil = await prisma.perfil.create({
    data: {
      nombre: '[TEST] Matías Pérez',
      rut: '66.666.666-6',
      institucion_id: instColegio.id,
      edad: 10,
      diagnostico_clinico: 'TEA',
      consentimiento_estado: 'ACEPTADO',
      consentimiento_sujeto: 'TUTOR_LEGAL',
      consentimiento_aceptado_at: aceptadoAt,
      consentimiento_version: '2026-02',
      consentimiento_por_usuario_id: familia.id
    }
  });

  await vincularUsuarioAPerfil(perfil.id, familia.id, 'FAMILIA', 'TUTOR', { puedeEditar: true });
  await prisma.perfilUsuario.update({
    where: {
      perfil_id_usuario_id: { perfil_id: perfil.id, usuario_id: familia.id }
    },
    data: { consentimiento_aceptado_at: aceptadoAt }
  });
  await vincularUsuarioAPerfil(perfil.id, medico.id, 'MEDICO');
  await vincularUsuarioAPerfil(perfil.id, profesional.id, 'PROFESIONAL');
  await vincularUsuarioAPerfil(perfil.id, educador.id, 'EDUCADOR');

  const obsPublica = await prisma.observacion.create({
    data: {
      titulo: '[TEST] Observación pública',
      descripcion: 'Descripción pública de prueba automatizada',
      categoria: 'CONDUCTA',
      fecha_evento: new Date(),
      perfil_id: perfil.id,
      autor_id: familia.id,
      privacidad: 'PUBLICA'
    }
  });

  const obsPrivada = await prisma.observacion.create({
    data: {
      titulo: '[TEST] Nota privada médica',
      descripcion: 'Descripción privada solo para médico',
      categoria: 'CLINICO',
      fecha_evento: new Date(),
      perfil_id: perfil.id,
      autor_id: medico.id,
      privacidad: 'PRIVADA'
    }
  });

  const obsMultinivel = await prisma.observacion.create({
    data: {
      titulo: '[TEST] Nota multinivel',
      descripcion: 'Descripción multinivel para profesional y médico',
      categoria: 'CLINICO',
      fecha_evento: new Date(),
      perfil_id: perfil.id,
      autor_id: medico.id,
      privacidad: 'MULTINIVEL'
    }
  });

  void superadmin;
  void admin;

  cachedFixture = {
    institucionSistemaId: sistema.id,
    institucionColegioId: instColegio.id,
    institucionCentroMedicoId: instCentroMedico.id,
    perfilId: perfil.id,
    obsPublicaId: obsPublica.id,
    obsPrivadaId: obsPrivada.id,
    obsMultinivelId: obsMultinivel.id
  };

  return cachedFixture;
}

export function getTestFixture(): TestFixture {
  if (!cachedFixture) {
    throw new Error('Ejecute seedTestDatabase() antes de getTestFixture()');
  }
  return cachedFixture;
}

if (require.main === module) {
  seedTestDatabase()
    .then(f => {
      console.log('[seed-test] OK', f);
    })
    .catch(e => {
      console.error('[seed-test] Error', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
