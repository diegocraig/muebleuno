import { prisma } from '@/lib/prisma'
import MedidaAdmin from '@/components/admin/MedidaAdmin'

export default async function CarpinterosAdminPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { pagina: 'carpinteros' }, update: {}, create: { pagina: 'carpinteros' } }),
    prisma.medidaServicio.findMany({ where: { pagina: 'carpinteros' }, orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ where: { pagina: 'carpinteros' }, orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ where: { pagina: 'carpinteros' }, orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ where: { pagina: 'carpinteros' }, orderBy: { orden: 'asc' } }),
  ])
  return <MedidaAdmin config={config} servicios={servicios} pasos={pasos} materiales={materiales} fotos={fotos} pagina="carpinteros" />
}
