import { PrismaClient } from '@prisma/client';

/** Borra datos de demo/aplicación; conserva catálogo MINEDUC/DEIS si existe. */
export async function clearDemoDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.auditoriaObservacion.deleteMany();
  await prisma.observacionEnReporte.deleteMany();
  await prisma.observacion.deleteMany();
  await prisma.reporte.deleteMany();
  await prisma.auditoriaAdmin.deleteMany();
  await prisma.solicitudInstitucionPerfil.deleteMany();
  await prisma.perfilUsuario.deleteMany();
  await prisma.perfil.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.institucion.deleteMany();
}
