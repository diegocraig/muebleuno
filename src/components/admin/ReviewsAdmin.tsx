'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Star, CheckCircle, XCircle } from 'lucide-react'

interface Producto { id: number; nombre: string }
interface Review {
  id: number; autor: string; ciudad?: string | null; texto: string
  rating: number; productoId?: number | null; activa: boolean; creadaEn: string
}

const emptyForm = { autor: '', ciudad: '', texto: '', rating: '5', productoId: '', activa: true }

function Stars({ rating, onChange }: { rating: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-5 h-5 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsAdmin({ reviews: initial, productos }: { reviews: Review[]; productos: Producto[] }) {
  const [reviews, setReviews] = useState(initial)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const openNew = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const openEdit = (r: Review) => {
    setForm({
      autor: r.autor, ciudad: r.ciudad ?? '', texto: r.texto,
      rating: String(r.rating), productoId: r.productoId ? String(r.productoId) : '',
      activa: r.activa,
    })
    setEditing(r.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const url = editing ? `/api/reviews/${editing}` : '/api/reviews'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (editing) {
      setReviews(prev => prev.map(r => r.id === editing ? data : r))
    } else {
      setReviews(prev => [data, ...prev])
    }
    setShowForm(false); setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta reseña?')) return
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const toggleActiva = async (r: Review) => {
    const res = await fetch(`/api/reviews/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...r, activa: !r.activa }),
    })
    const data = await res.json()
    setReviews(prev => prev.map(x => x.id === r.id ? data : x))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-rojo-principal text-white px-4 py-2 rounded-lg hover:bg-rojo-hover transition-colors">
          <Plus className="w-4 h-4" /> Nueva reseña
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gris-fondo border-b">
            <tr>
              <th className="text-left px-4 py-3">Autor</th>
              <th className="text-left px-4 py-3">Reseña</th>
              <th className="text-left px-4 py-3">Valoración</th>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-center px-4 py-3">Visible</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reviews.map(r => (
              <tr key={r.id} className="hover:bg-gris-fondo/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.autor}</p>
                  {r.ciudad && <p className="text-xs text-gris-claro">{r.ciudad}</p>}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="line-clamp-2 text-gris-medio">{r.texto}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gris-medio text-xs">
                  {r.productoId ? productos.find(p => p.id === r.productoId)?.nombre ?? '—' : <span className="italic">General</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActiva(r)}>
                    {r.activa
                      ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p className="text-center py-8 text-gris-medio">No hay reseñas</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Editar reseña' : 'Nueva reseña'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Autor *</label>
                  <input required value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: María G." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Corrientes" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valoración *</label>
                <Stars rating={parseInt(form.rating)} onChange={n => setForm(f => ({ ...f, rating: String(n) }))} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reseña *</label>
                <textarea required rows={4} value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Escribí la reseña del cliente..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Producto asociado</label>
                <p className="text-xs text-gris-claro mb-1.5">Dejá en blanco para que aparezca como reseña general del negocio.</p>
                <select value={form.productoId} onChange={e => setForm(f => ({ ...f, productoId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">— General (sin producto específico) —</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} />
                <span className="text-sm">Visible en el sitio</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 border rounded-lg hover:bg-gris-fondo transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
