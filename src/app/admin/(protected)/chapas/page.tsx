import { prisma } from '@/lib/prisma'
import MedidaAdmin from '@/components/admin/MedidaAdmin'

export default async function ChapasAdminPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { pagina: 'chapas' }, update: {}, create: { pagina: 'chapas' } }),
    prisma.medidaServicio.findMany({ where: { pagina: 'chapas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ where: { pagina: 'chapas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ where: { pagina: 'chapas' }, orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ where: { pagina: 'chapas' }, orderBy: { orden: 'asc' } }),
  ])
  return <MedidaAdmin config={config} servicios={servicios} pasos={pasos} materiales={materiales} fotos={fotos} pagina="chapas" />
}
