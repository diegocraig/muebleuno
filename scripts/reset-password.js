const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const NEW_PASSWORD = 'Mueble2026Adm!'

bcrypt.hash(NEW_PASSWORD, 10).then(hash =>
  prisma.usuario.update({
    where: { email: 'admin@muebleuno.com' },
    data: { password: hash }
  })
).then(() => {
  console.log('Contraseña actualizada correctamente.')
  console.log('Email: admin@muebleuno.com')
  console.log('Contraseña: ' + NEW_PASSWORD)
  process.exit(0)
}).catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
