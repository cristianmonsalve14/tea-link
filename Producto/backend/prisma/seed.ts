import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = 'cr.monsalveb@duocuc.cl';
const SUPERADMIN_PASSWORD = 'SuperAdmin123!';

async function main() {
  let sistema = await prisma.institucion.findFirst({
    where: { tipo: 'SISTEMA' }
  });

  if (!sistema) {
    sistema = await prisma.institucion.create({
      data: {
        nombre: 'Sistema TEA-LINK',
        tipo: 'SISTEMA'
      }
    });
    console.log('Institución SISTEMA creada:', sistema.id);
  }

  const existing = await prisma.usuario.findUnique({
    where: { email: SUPERADMIN_EMAIL }
  });

  if (existing) {
    console.log('SUPERADMIN ya existe:', existing.email);
    return;
  }

  const password_hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  const user = await prisma.usuario.create({
    data: {
      email: SUPERADMIN_EMAIL,
      nombre_completo: 'Super Administrador',
      rol: 'SUPERADMIN',
      password_hash,
      institucion_id: sistema.id
    }
  });

  console.log('SUPERADMIN creado:', user.email, '(id:', user.id, ')');
  console.log('Contraseña de prueba:', SUPERADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
