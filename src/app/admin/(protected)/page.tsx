import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Package, Layers, ShoppingBag, Clock } from 'lucide-react'
import PedidosAdmin from '@/components/admin/PedidosAdmin'
import { getPedidosEnriquecidos } from '@/lib/pedidos'

export default async function AdminDashboard() {
  const [totalProductos, totalCategorias, pedidosPendientes, pedidosMes, ultimosPedidos] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.categoria.count({ where: { activa: true } }),
    prisma.pedido.count({ where: { estado: 'pendiente' } }),
    prisma.pedido.count({
      where: { creadoEn: { gte: new Date(new Date().setDate(1)) } },
    }),
    getPedidosEnriquecidos({ take: 10 }),
  ])

  const cards = [
    { label: 'Productos activos', value: totalProductos, icon: Package, href: '/admin/productos', color: 'bg-blue-500' },
    { label: 'Categorías', value: totalCategorias, icon: Layers, href: '/admin/categorias', color: 'bg-purple-500' },
    { label: 'Pedidos pendientes', value: pedidosPendientes, icon: ShoppingBag, href: '/admin/pedidos', color: 'bg-rojo-principal' },
    { label: 'Pedidos este mes', value: pedidosMes, icon: Clock, href: '/admin/pedidos', color: 'bg-green-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs text-gris-medio">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-end mb-2">
        <Link href="/admin/pedidos" className="text-sm text-rojo-principal hover:underline">Ver todos los pedidos</Link>
      </div>
      {ultimosPedidos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-lg mb-2">Últimos pedidos</h2>
          <p className="text-gris-medio text-sm">Sin pedidos aún</p>
        </div>
      ) : (
        <PedidosAdmin pedidos={ultimosPedidos} heading="Últimos pedidos" />
      )}
    </div>
  )
}
