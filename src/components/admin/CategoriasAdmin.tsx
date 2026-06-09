'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { slugify } from '@/lib/utils'
import ImageUploader from './ImageUploader'

interface Categoria {
  id: number; nombre: string; slug: string; imagen?: string | null
  orden: number; activa: boolean; tipoBoton: string; urlPagina?: string | null
  _count: { productos: number }
}

const empty = {
  nombre: '', slug: '', imagen: null as string | null, orden: '0', activa: true,
  tipoBoton: 'catalogo', urlPagina: '',
}

export default function CategoriasAdmin({ categorias: initial }: { categorias: Categoria[] }) {
  const [categorias, setCategorias] = useState(initial)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const openNew = () => { setForm(empty); setEditing(null); setShowForm(true) }
  const openEdit = (c: Categoria) => {
    setForm({
      nombre: c.nombre, slug: c.slug, imagen: c.imagen ?? null,
      orden: String(c.orden), activa: c.activa,
      tipoBoton: c.tipoBoton ?? 'catalogo', urlPagina: c.urlPagina ?? '',
    })
    setEditing(c.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const body = {
      ...form,
      slug: form.slug || slugify(form.nombre),
      urlPagina: form.tipoBoton === 'pagina' ? form.urlPagina : null,
    }
    const url = editing ? `/api/categorias/${editing}` : '/api/categorias'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (editing) {
      setCategorias(prev => prev.map(c => c.id === editing ? { ...data, _count: { productos: c._count.productos } } : c))
    } else {
      setCategorias(prev => [...prev, { ...data, _count: { productos: 0 } }])
    }
    setShowForm(false); setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
    setCategorias(prev => prev.filter(c => c.id !== id))
  }

  const imgs = form.imagen ? [form.imagen] : []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-rojo-principal text-white px-4 py-2 rounded-lg hover:bg-rojo-hover transition-colors">
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gris-fondo border-b">
            <tr>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-center px-4 py-3">Orden</th>
              <th className="text-center px-4 py-3">Productos</th>
              <th className="text-left px-4 py-3">Destino botón</th>
              <th className="text-center px-4 py-3">Activa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categorias.map(c => (
              <tr key={c.id} className="hover:bg-gris-fondo/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gris-fondo overflow-hidden shrink-0">
                      {c.imagen && <img src={c.imagen} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-medium">{c.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gris-medio">{c.slug}</td>
                <td className="px-4 py-3 text-center">{c.orden}</td>
                <td className="px-4 py-3 text-center">{c._count.productos}</td>
                <td className="px-4 py-3">
                  {c.tipoBoton === 'pagina' && c.urlPagina ? (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[140px]">{c.urlPagina}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gris-medio">Tabla de productos</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${c.activa ? 'bg-green-500' : 'bg-gris-claro'}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowForm(false)} className="text-xl text-gris-claro hover:text-gris-oscuro">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value, slug: slugify(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Orden</label>
                <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <ImageUploader context="categoria" images={imgs} onChange={newImgs => setForm(f => ({ ...f, imagen: newImgs[0] ?? null }))} />

              {/* Destino del botón */}
              <div className="border rounded-lg p-4 space-y-3 bg-gris-fondo/50">
                <p className="text-sm font-medium">Destino del botón en el catálogo</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="tipoBoton" value="catalogo"
                    checked={form.tipoBoton === 'catalogo'}
                    onChange={() => setForm(f => ({ ...f, tipoBoton: 'catalogo', urlPagina: '' }))}
                    className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tabla de productos</p>
                    <p className="text-xs text-gris-medio">Muestra el listado filtrado por esta categoría</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="tipoBoton" value="pagina"
                    checked={form.tipoBoton === 'pagina'}
                    onChange={() => setForm(f => ({ ...f, tipoBoton: 'pagina' }))}
                    className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Página específica</p>
                    <p className="text-xs text-gris-medio">Redirige a una página personalizada</p>
                  </div>
                </label>
                {form.tipoBoton === 'pagina' && (
                  <div className="pl-6">
                    <label className="block text-xs font-medium mb-1 text-gris-medio">URL de la página (ej: /muebles-a-medida)</label>
                    <input
                      value={form.urlPagina}
                      onChange={e => setForm(f => ({ ...f, urlPagina: e.target.value }))}
                      placeholder="/muebles-a-medida"
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                      required={form.tipoBoton === 'pagina'}
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} />
                <span className="text-sm">Activa</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 border rounded-lg hover:bg-gris-fondo text-sm">
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
