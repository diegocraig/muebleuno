import { prisma } from '@/lib/prisma'
import ConfiguracionAdmin from '@/components/admin/ConfiguracionAdmin'

export default async function AdminConfigPage() {
  const config = await prisma.configuracion.findUnique({ where: { id: 1 } })
  return <ConfiguracionAdmin config={config} />
}
