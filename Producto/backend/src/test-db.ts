// Script de prueba de conexión a la base de datos
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Probando conexión a PostgreSQL...\n')
    
    // Test 1: Contar usuarios
    const totalUsuarios = await prisma.usuario.count()
    console.log(`✅ Total de usuarios: ${totalUsuarios}`)
    
    // Test 2: Listar usuarios
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre_completo: true,
        rol: true
      }
    })
    console.log('\n📋 Usuarios en la base de datos:')
    usuarios.forEach(u => {
      console.log(`   - ${u.nombre_completo} (${u.email}) - Rol: ${u.rol}`)
    })
    
    // Test 3: Contar perfiles
    const totalPerfiles = await prisma.perfil.count()
    console.log(`\n✅ Total de perfiles: ${totalPerfiles}`)
    
    // Test 4: Listar perfiles con usuario
    const perfiles = await prisma.perfil.findMany({
      include: {
        usuario: {
          select: {
            nombre_completo: true,
            rol: true
          }
        }
      }
    })
    console.log('\n👤 Perfiles registrados:')
    perfiles.forEach(p => {
      console.log(`   - ${p.nombre} (${p.edad} años) - Gestionado por: ${p.usuario.nombre_completo}`)
    })
    
    // Test 5: Contar observaciones
    const totalObservaciones = await prisma.observacion.count()
    console.log(`\n✅ Total de observaciones: ${totalObservaciones}`)
    
    // Test 6: Listar observaciones con detalles
    const observaciones = await prisma.observacion.findMany({
      include: {
        perfil: { select: { nombre: true } },
        autor: { select: { nombre_completo: true, rol: true } }
      },
      orderBy: { fecha_evento: 'desc' }
    })
    console.log('\n📝 Observaciones registradas:')
    observaciones.forEach(o => {
      const fecha = new Date(o.fecha_evento).toLocaleDateString('es-CL')
      console.log(`   - [${o.categoria}] ${o.titulo}`)
      console.log(`     Perfil: ${o.perfil.nombre} | Autor: ${o.autor.nombre_completo} (${o.autor.rol}) | Fecha: ${fecha}`)
    })
    
    console.log('\n✅ ¡Conexión exitosa! La base de datos está funcionando correctamente.\n')
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
