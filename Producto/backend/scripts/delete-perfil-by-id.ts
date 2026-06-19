import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const id = Number(process.argv[2] ?? 9);

async function main() {
  const perfil = await prisma.perfil.findUnique({ where: { id } });
  if (!perfil) {
    console.log('Perfil no encontrado:', id);
    return;
  }
  await prisma.perfilUsuario.deleteMany({ where: { perfil_id: id } });
  await prisma.perfil.delete({ where: { id } });
  console.log('Perfil eliminado:', perfil.nombre, `(#${id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
