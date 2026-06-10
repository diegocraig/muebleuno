'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Truck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface TipoEnvio {
  id: number
  nombre: string
  costo: number
  activo: boolean
}

const emptyForm = { nombre: '', costo: '', activo: true }

export default function TiposEnvioAdmin({ tipos: initial }: { tipos: TipoEnvio[] }) {
  const [tipos, setTipos] = useState(initial)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const openNew = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const openEdit = (t: TipoEnvio) => {
    setForm({ nombre: t.nombre, costo: String(t.costo), activo: t.activo })
    setEditing(t.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const url = editing ? `/api/tipos-envio/${editing}` : '/api/tipos-envio'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (editing) {
      setTipos(prev => prev.map(t => t.id === editing ? data : t))
    } else {
      setTipos(prev => [...prev, data])
    }
    setShowForm(false); setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este tipo de envío?')) return
    await fetch(`/api/tipos-envio/${id}`, { method: 'DELETE' })
    setTipos(prev => prev.filter(t => t.id !== id))
  }

  const toggleActivo = async (t: TipoEnvio) => {
    const res = await fetch(`/api/tipos-envio/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, activo: !t.activo }),
    })
    const data = await res.json()
    setTipos(prev => prev.map(x => x.id === t.id ? data : x))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tipos de envío</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-rojo-principal text-white px-4 py-2 rounded-lg hover:bg-rojo-hover transition-colors">
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gris-fondo border-b">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Costo</th>
              <th className="text-center px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tipos.map(t => (
              <tr key={t.id} className="hover:bg-gris-fondo/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gris-claro shrink-0" />
                    <span className="font-medium">{t.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-rojo-principal">
                  {t.costo === 0 ? <span className="text-green-600 font-semibold">Gratis</span> : formatPrice(t.costo)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActivo(t)}>
                    {t.activo
                      ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tipos.length === 0 && (
          <div className="text-center py-12 text-gris-medio">
            <Truck className="w-10 h-10 mx-auto mb-3 text-gris-claro" />
            <p>No hay tipos de envío. Creá el primero.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Editar tipo de envío' : 'Nuevo tipo de envío'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Envío a domicilio, Retiro en tienda" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Costo *</label>
                <p className="text-xs text-gris-claro mb-1.5">Ingresá 0 para envío gratuito.</p>
                <input required type="number" min="0" step="0.01" value={form.costo}
                  onChange={e => setForm(f => ({ ...f, costo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: 5000" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                <span className="text-sm">Visible para los clientes</span>
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
