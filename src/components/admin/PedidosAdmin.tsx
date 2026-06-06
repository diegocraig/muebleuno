'use client'
import { useState } from 'react'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface PedidoItem { productoId: number; nombre: string; precio: number; cantidad: number }
interface Pedido {
  id: number; nombre: string; email: string; telefono: string
  items: string; total: number; estado: string; notas?: string | null; creadoEn: Date
}

const ESTADOS = ['pendiente', 'en proceso', 'completado', 'cancelado']
const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  'en proceso': 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

export default function PedidosAdmin({ pedidos: initial }: { pedidos: Pedido[] }) {
  const [pedidos, setPedidos] = useState(initial)
  const [selected, setSelected] = useState<Pedido | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtrados = pedidos.filter(p => !filtroEstado || p.estado === filtroEstado)

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/muebleuno/api/pedidos/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p))
    if (selected?.id === id) setSelected(s => s ? { ...s, estado } : s)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gris-fondo border-b">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`cursor-pointer hover:bg-gris-fondo/50 ${selected?.id === p.id ? 'bg-rojo-suave' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(p.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[p.estado] ?? ''}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris-medio">{new Date(p.creadoEn).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="text-center py-8 text-gris-medio">Sin pedidos</p>}
        </div>

        {selected && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-lg">Pedido #{selected.id}</h2>
                <p className="text-sm text-gris-medio">{new Date(selected.creadoEn).toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Nombre:</span> {selected.nombre}</p>
              <p><span className="font-medium">Email:</span> {selected.email}</p>
              <p><span className="font-medium">Teléfono:</span> {selected.telefono}</p>
              {selected.notas && <p><span className="font-medium">Notas:</span> {selected.notas}</p>}
            </div>

            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2 mb-4">
              {(JSON.parse(selected.items) as PedidoItem[]).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.nombre} × {item.cantidad}</span>
                  <span className="font-bold">{formatPrice(item.precio * item.cantidad)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-rojo-principal">{formatPrice(selected.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1">
                <select
                  value={selected.estado}
                  onChange={e => cambiarEstado(selected.id, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm appearance-none"
                >
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <a
                href={`https://wa.me/${selected.telefono.replace(/\D/g, '')}?text=Hola ${selected.nombre}, te contactamos por tu pedido #${selected.id}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
