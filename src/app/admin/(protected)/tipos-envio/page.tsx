import { prisma } from '@/lib/prisma'
import TiposEnvioAdmin from '@/components/admin/TiposEnvioAdmin'

export default async function TiposEnvioPage() {
  const tipos = await prisma.tipoEnvio.findMany({ orderBy: { id: 'asc' } })
  return <TiposEnvioAdmin tipos={tipos} />
}
