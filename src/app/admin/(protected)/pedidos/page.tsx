import { prisma } from '@/lib/prisma'
import PedidosAdmin from '@/components/admin/PedidosAdmin'

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedido.findMany({ orderBy: { creadoEn: 'desc' } })
  return <PedidosAdmin pedidos={pedidos} />
}
