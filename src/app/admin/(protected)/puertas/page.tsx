import { prisma } from '@/lib/prisma'
import MedidaAdmin from '@/components/admin/MedidaAdmin'

export default async function PuertasAdminPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { pagina: 'puertas' }, update: {}, create: { pagina: 'puertas' } }),
    prisma.medidaServicio.findMany({ where: { pagina: 'puertas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ where: { pagina: 'puertas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ where: { pagina: 'puertas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ where: { pagina: 'puertas' }, orderBy: { orden: 'asc' } }),
  ])
  return <MedidaAdmin config={config} servicios={servicios} pasos={pasos} materiales={materiales} fotos={fotos} pagina="puertas" />
}
