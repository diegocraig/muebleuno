'use client'
import { useState } from 'react'
import { MessageCircle, Star } from 'lucide-react'
import { formatPrice, displayPedidoId } from '@/lib/utils'

interface PedidoItem { productoId: number; nombre: string; precio: number; cantidad: number; slug?: string }
interface TipoEnvio { id: number; nombre: string; costo: number }
interface Pedido {
  id: number; nombre: string; email: string; telefono: string
  items: string; itemsDetalle: PedidoItem[]; total: number; estado: string
  notas?: string | null; direccion?: string | null; creadoEn: Date
  costoEnvio?: number; tipoEnvioId?: number | null; tipoEnvio?: TipoEnvio | null
  navePagoEstado?: string | null; navePaymentRequestId?: string | null
}

const ESTADOS = ['pendiente', 'pagado', 'en proceso', 'completado', 'rechazado', 'cancelado', 'devuelto']
const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  pagado: 'bg-green-100 text-green-700',
  'en proceso': 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  cancelado: 'bg-red-100 text-red-700',
  devuelto: 'bg-orange-100 text-orange-700',
}

const fmtFechaHora = (d: Date | string) =>
  new Date(d).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

function ModalReview({ pedido, onClose }: { pedido: Pedido; onClose: () => void }) {
  const items = pedido.itemsDetalle
  const [form, setForm] = useState({
    autor: pedido.nombre, ciudad: '', texto: '', rating: 5,
    productoId: items[0]?.productoId ? String(items[0].productoId) : '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, activa: true }),
    })
    setSaving(false)
    setDone(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="font-bold text-lg">Cargar reseña del pedido #{displayPedidoId(pedido.id)}</h2>
          <button onClick={onClose} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
        </div>
        {done ? (
          <div className="px-6 py-10 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold">Reseña guardada</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Autor</label>
                <input value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <input value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Corrientes" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valoración</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                    <Star className={`w-6 h-6 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Producto reseñado</label>
              <select value={form.productoId} onChange={e => setForm(f => ({ ...f, productoId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">— Reseña general del negocio —</option>
                {items.map(item => (
                  <option key={item.productoId} value={item.productoId}>{item.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reseña</label>
              <textarea required rows={4} value={form.texto}
                onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Escribí la opinión del cliente..." />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg">
                {saving ? 'Guardando...' : 'Guardar reseña'}
              </button>
              <button type="button" onClick={onClose}
                className="px-5 border rounded-lg hover:bg-gris-fondo text-sm">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function PedidosAdmin({ pedidos: initial, heading = 'Pedidos' }: { pedidos: Pedido[]; heading?: string }) {
  const [pedidos, setPedidos] = useState(initial)
  // Al ingresar, mostrar el pedido más reciente (los pedidos vienen ordenados por fecha desc).
  const [selected, setSelected] = useState<Pedido | null>(initial[0] ?? null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [reviewPedido, setReviewPedido] = useState<Pedido | null>(null)

  const filtrados = pedidos.filter(p => !filtroEstado || p.estado === filtroEstado)

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p))
    if (selected?.id === id) setSelected(s => s ? { ...s, estado } : s)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{heading}</h1>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="@container bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gris-fondo border-b">
              <tr>
                <th className="text-left px-2 @lg:px-4 py-3">ID</th>
                <th className="text-left px-2 @lg:px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3 hidden @2xl:table-cell">Teléfono</th>
                <th className="text-left px-2 @lg:px-4 py-3">Total</th>
                <th className="text-left px-2 @lg:px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3 hidden @lg:table-cell">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`cursor-pointer hover:bg-gris-fondo/50 ${selected?.id === p.id ? 'bg-rojo-suave' : ''}`}>
                  <td className="px-2 @lg:px-4 py-3 font-mono text-xs align-top">#{displayPedidoId(p.id)}</td>
                  <td className="px-2 @lg:px-4 py-3 font-medium break-words">
                    {p.nombre}
                    {/* Cuando el bloque es angosto, las columnas que se ocultan se muestran acá en chiquito */}
                    <span className="block @2xl:hidden text-xs font-normal text-gris-medio">{p.telefono}</span>
                    <span className="block @lg:hidden text-xs font-normal text-gris-medio">{fmtFechaHora(p.creadoEn)}</span>
                  </td>
                  <td className="px-4 py-3 text-gris-medio whitespace-nowrap hidden @2xl:table-cell align-top">{p.telefono}</td>
                  <td className="px-2 @lg:px-4 py-3 font-bold whitespace-nowrap align-top">{formatPrice(p.total)}</td>
                  <td className="px-2 @lg:px-4 py-3 align-top">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[p.estado] ?? ''}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris-medio whitespace-nowrap hidden @lg:table-cell align-top">{fmtFechaHora(p.creadoEn)}</td>
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
                <h2 className="font-bold text-lg">Pedido #{displayPedidoId(selected.id)}</h2>
                <p className="text-sm text-gris-medio">{fmtFechaHora(selected.creadoEn)} hs</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Nombre:</span> {selected.nombre}</p>
              <p><span className="font-medium">Email:</span> <a className="text-blue-600 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></p>
              <p><span className="font-medium">Teléfono:</span> {selected.telefono}</p>
              {selected.direccion && <p className="whitespace-pre-line"><span className="font-medium">Dirección de envío:</span> {selected.direccion}</p>}
              {selected.notas && <p><span className="font-medium">Notas:</span> {selected.notas}</p>}
              <p>
                <span className="font-medium">Estado del pedido:</span>{' '}
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[selected.estado] ?? ''}`}>{selected.estado}</span>
              </p>
              <p><span className="font-medium">Estado de pago (Nave):</span> {selected.navePagoEstado ?? '— sin registro —'}</p>
              <p><span className="font-medium">Tipo de envío:</span> {selected.tipoEnvio?.nombre ?? '—'}</p>
              <p><span className="font-medium">Costo de envío:</span> {selected.costoEnvio ? formatPrice(selected.costoEnvio) : 'Gratis / —'}</p>
              {selected.navePaymentRequestId && (
                <p className="break-all"><span className="font-medium">ID de pago Nave:</span> <span className="font-mono text-xs">{selected.navePaymentRequestId}</span></p>
              )}
            </div>

            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2 mb-4">
              {selected.itemsDetalle.map((item, i) => (
                <div key={i} className="flex justify-between gap-2 text-sm">
                  {item.slug ? (
                    <a
                      href={`/productos/${item.slug}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.nombre} × {item.cantidad}
                    </a>
                  ) : (
                    <span>{item.nombre} × {item.cantidad}</span>
                  )}
                  <span className="font-bold whitespace-nowrap">{formatPrice(item.precio * item.cantidad)}</span>
                </div>
              ))}
              {selected.costoEnvio ? (
                <div className="flex justify-between text-sm text-gris-medio">
                  <span>Envío {selected.tipoEnvio?.nombre ? `(${selected.tipoEnvio.nombre})` : ''}</span>
                  <span>{formatPrice(selected.costoEnvio)}</span>
                </div>
              ) : null}
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
                href={`https://wa.me/${selected.telefono.replace(/\D/g, '')}?text=Hola ${selected.nombre}, te contactamos por tu pedido #${displayPedidoId(selected.id)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <button
                onClick={() => setReviewPedido(selected)}
                className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-sm font-semibold px-3 py-2 rounded-lg"
              >
                <Star className="w-4 h-4" /> Reseña
              </button>
            </div>
          </div>
        )}
      </div>

      {reviewPedido && (
        <ModalReview pedido={reviewPedido} onClose={() => setReviewPedido(null)} />
      )}
    </div>
  )
}
