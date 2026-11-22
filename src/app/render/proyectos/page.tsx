import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatPrice, displayPedidoId } from '@/lib/utils'
import BorrarProyecto from './BorrarProyecto'

const ESTADOS: Record<string, string> = { borrador: 'bg-gray-100 text-gris-medio', presupuesto: 'bg-amber-100 text-amber-800', venta: 'bg-green-100 text-green-700' }

export default async function ProyectosPage() {
  const proyectos = await prisma.renderProyecto.findMany({
    orderBy: { actualizadoEn: 'desc' },
    select: { id: true, nombre: true, cliente: true, total: true, estado: true, captura: true, pedidoId: true, actualizadoEn: true },
  })
  return (
    <div className="min-h-screen bg-gris-fondo">
      <header className="flex h-14 items-center gap-3 border-b border-gray-100 bg-white px-4 shadow-sm">
        <Link href="/render"><Image src="/logo.png" alt="Mueble UNO" width={130} height={28} className="h-7 w-auto" /></Link>
        <span className="rounded bg-rojo-suave px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rojo-principal">Render · proyectos</span>
        <div className="ml-auto flex gap-2">
          <Link href="/render/electrodomesticos" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gris-medio hover:bg-gris-fondo">Base de electrodomésticos</Link>
          <Link href="/render" className="inline-flex items-center gap-1 rounded-lg bg-rojo-principal px-3 py-1.5 text-sm font-semibold text-white hover:bg-rojo-hover"><Plus className="h-4 w-4" /> Nueva cocina</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Proyectos de cocina</h1>
        {!proyectos.length && <p className="text-gris-medio">Todavía no hay proyectos guardados.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map(p => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <Link href={`/render?p=${p.id}`} className="block aspect-video bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.captura && <img src={p.captura} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/render?p=${p.id}`} className="font-bold hover:text-rojo-principal">{p.nombre}</Link>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADOS[p.estado] ?? ESTADOS.borrador}`}>{p.estado}</span>
                </div>
                <p className="text-sm text-gris-medio">{p.cliente || 'Sin cliente'} · {p.actualizadoEn.toLocaleDateString('es-AR')}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-rojo-principal">{formatPrice(p.total)}</span>
                  <span className="flex items-center gap-3 text-xs">
                    {p.pedidoId && <span className="text-green-700">Pedido #{displayPedidoId(p.pedidoId)}</span>}
                    <Link href={`/render/presupuesto/${p.id}`} className="font-semibold text-gris-medio hover:text-rojo-principal">Presupuesto</Link>
                    <BorrarProyecto id={p.id} nombre={p.nombre} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
