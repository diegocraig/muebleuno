import { prisma } from '@/lib/prisma'
import MedidaAdmin from '@/components/admin/MedidaAdmin'

export default async function MedidaPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { pagina: 'medida' }, update: {}, create: { pagina: 'medida' } }),
    prisma.medidaServicio.findMany({ where: { pagina: 'medida' }, orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ where: { pagina: 'medida' }, orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ where: { pagina: 'medida' }, orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ where: { pagina: 'medida' }, orderBy: { orden: 'asc' } }),
  ])
  return <MedidaAdmin config={config} servicios={servicios} pasos={pasos} materiales={materiales} fotos={fotos} pagina="medida" />
}
