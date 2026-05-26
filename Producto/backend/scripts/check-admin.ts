import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.usuario.findMany({
    where: { rol: 'ADMINISTRADOR' },
    include: { institucion: { select: { id: true, nombre: true, tipo: true } } }
  });
  console.log(JSON.stringify(admins, null, 2));
}

main().finally(() => prisma.$disconnect());
