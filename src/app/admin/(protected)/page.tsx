import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Package, Layers, ShoppingBag, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import DashboardFiltro from '@/components/admin/DashboardFiltro'

export const dynamic = 'force-dynamic'

// Estados que cuentan como "cobrado" para ingresos.
const COBRADOS = ['pagado', 'completado']

// Rango de fechas en horario de Argentina (UTC-3, sin DST). ART 00:00 = 03:00 UTC.
function rangoFechas(periodo: string, desde?: string, hasta?: string) {
  const TZ = 3 * 60 * 60 * 1000
  const artNow = new Date(Date.now() - TZ) // leer campos UTC = hora de pared ART
  const y = artNow.getUTCFullYear(), m = artNow.getUTCMonth(), d = artNow.getUTCDate(), dow = artNow.getUTCDay()
  const artMid = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm, dd, 3, 0, 0))
  const ahora = new Date()

  switch (periodo) {
    case 'hoy':
      return { gte: artMid(y, m, d), lt: ahora, label: 'Hoy' }
    case 'semana': {
      const offset = (dow + 6) % 7 // lunes como inicio de semana
      return { gte: artMid(y, m, d - offset), lt: ahora, label: 'Esta semana' }
    }
    case 'anio':
      return { gte: artMid(y, 0, 1), lt: ahora, label: 'Este año' }
    case 'custom': {
      if (desde && hasta) {
        const [y1, m1, d1] = desde.split('-').map(Number)
        const [y2, m2, d2] = hasta.split('-').map(Number)
        return { gte: artMid(y1, m1 - 1, d1), lt: artMid(y2, m2 - 1, d2 + 1), label: `${desde} → ${hasta}` }
      }
      return { gte: artMid(y, m, 1), lt: ahora, label: 'Este mes' }
    }
    case 'mes':
    default:
      return { gte: artMid(y, m, 1), lt: ahora, label: 'Este mes' }
  }
}

interface PageProps {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const sp = await searchParams
  const periodo = sp.periodo ?? 'mes'
  const { gte, lt, label } = rangoFechas(periodo, sp.desde, sp.hasta)
  const where = { creadoEn: { gte, lt } }

  const [pedidosTotal, pedidosPagados, agg, pendientesGlobal, totalProductos, totalCategorias] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.count({ where: { ...where, estado: { in: COBRADOS } } }),
    prisma.pedido.aggregate({ _sum: { total: true }, where: { ...where, estado: { in: COBRADOS } } }),
    prisma.pedido.count({ where: { estado: 'pendiente' } }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.categoria.count({ where: { activa: true } }),
  ])

  const ingresos = agg._sum.total ?? 0
  const ticket = pedidosPagados ? ingresos / pedidosPagados : 0

  const cardsPeriodo = [
    { label: 'Ingresos (cobrados)', value: formatPrice(ingresos), icon: DollarSign, color: 'bg-green-600' },
    { label: 'Pedidos pagados', value: pedidosPagados, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pedidos totales', value: pedidosTotal, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Ticket promedio', value: formatPrice(ticket), icon: TrendingUp, color: 'bg-purple-500' },
  ]

  const cardsGlobal = [
    { label: 'Pedidos pendientes', value: pendientesGlobal, icon: Clock, href: '/admin/pedidos', color: 'bg-rojo-principal' },
    { label: 'Productos activos', value: totalProductos, icon: Package, href: '/admin/productos', color: 'bg-blue-500' },
    { label: 'Categorías', value: totalCategorias, icon: Layers, href: '/admin/categorias', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Suspense fallback={null}>
        <DashboardFiltro />
      </Suspense>

      <h2 className="text-sm font-semibold text-gris-medio uppercase tracking-wide mb-2">
        Período: <span className="text-gris-oscuro">{label}</span>
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cardsPeriodo.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black truncate">{value}</p>
              <p className="text-xs text-gris-medio">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gris-medio uppercase tracking-wide mb-2">General</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsGlobal.map(({ label, value, icon: Icon, href, color }) => (
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
    </div>
  )
}
