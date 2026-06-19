import PedidosAdmin from '@/components/admin/PedidosAdmin'
import { getPedidosEnriquecidos } from '@/lib/pedidos'

export default async function AdminPedidosPage() {
  const pedidos = await getPedidosEnriquecidos()
  return <PedidosAdmin pedidos={pedidos} />
}
