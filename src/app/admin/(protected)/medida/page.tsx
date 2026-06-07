import { prisma } from '@/lib/prisma'
import MedidaAdmin from '@/components/admin/MedidaAdmin'

export default async function MedidaPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.medidaServicio.findMany({ orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ orderBy: { orden: 'asc' } }),
  ])
  return <MedidaAdmin config={config} servicios={servicios} pasos={pasos} materiales={materiales} fotos={fotos} />
}
