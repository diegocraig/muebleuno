import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Package, Layers, ShoppingBag, Clock } from 'lucide-react'

export default async function AdminDashboard() {
  const [totalProductos, totalCategorias, pedidosPendientes, pedidosMes, ultimosPedidos] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.categoria.count({ where: { activa: true } }),
    prisma.pedido.count({ where: { estado: 'pendiente' } }),
    prisma.pedido.count({
      where: { creadoEn: { gte: new Date(new Date().setDate(1)) } },
    }),
    prisma.pedido.findMany({ orderBy: { creadoEn: 'desc' }, take: 5 }),
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

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Últimos Pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm text-rojo-principal hover:underline">Ver todos</Link>
        </div>
        {ultimosPedidos.length === 0 ? (
          <p className="text-gris-medio text-sm">Sin pedidos aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gris-medio">
                  <th className="text-left pb-2">ID</th>
                  <th className="text-left pb-2">Cliente</th>
                  <th className="text-left pb-2">Total</th>
                  <th className="text-left pb-2">Estado</th>
                  <th className="text-left pb-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ultimosPedidos.map(p => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono text-xs">#{p.id}</td>
                    <td className="py-2">{p.nombre}</td>
                    <td className="py-2 font-bold">${p.total.toLocaleString('es-AR')}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        p.estado === 'completado' ? 'bg-green-100 text-green-700' :
                        p.estado === 'cancelado' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-2 text-gris-medio">{new Date(p.creadoEn).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
