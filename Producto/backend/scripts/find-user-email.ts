import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2] ?? 'eduardoaltavida@email.com';

async function main() {
  const normalized = email.trim().toLowerCase();
  const users = await prisma.usuario.findMany({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      nombre_completo: true,
      rol: true,
      institucion_id: true,
      institucion: { select: { nombre: true } }
    }
  });
  console.log('Búsqueda:', normalized);
  console.log('Encontrados:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
