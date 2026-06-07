'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { formatPrice, slugify } from '@/lib/utils'
import ImageUploader from './ImageUploader'

interface Categoria { id: number; nombre: string; slug: string }
interface Subcategoria { id: number; nombre: string; slug: string; categoriaId: number }
interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; stock: number; destacado: boolean; novedad: boolean
  enPromocion: boolean; activo: boolean; categoriaId: number; categoria: Categoria
  subcategoriaId?: number | null; subcategoria?: Subcategoria | null
  descripcion?: string | null; datosUtiles?: string | null
  infoEmbalaje?: string | null; garantia?: string | null
}

const emptyForm = {
  nombre: '', slug: '', descripcion: '', datosUtiles: '', infoEmbalaje: '', garantia: '',
  precio: '', precioOferta: '', categoriaId: '', subcategoriaId: '',
  stock: '0', destacado: false, novedad: false, enPromocion: false, activo: true,
  imagenes: [] as string[],
}

export default function ProductosAdmin({
  productos: initial,
  categorias,
  subcategorias,
}: {
  productos: Producto[]
  categorias: Categoria[]
  subcategorias: Subcategoria[]
}) {
  const [productos, setProductos] = useState(initial)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [buscar, setBuscar] = useState('')

  const filtrados = productos.filter(p =>
    (!filtroCategoria || p.categoriaId === parseInt(filtroCategoria)) &&
    (!buscar || p.nombre.toLowerCase().includes(buscar.toLowerCase()))
  )

  const subcatsFiltradas = subcategorias.filter(s =>
    form.categoriaId && s.categoriaId === parseInt(form.categoriaId)
  )

  const openNew = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const openEdit = (p: Producto) => {
    setForm({
      nombre: p.nombre, slug: p.slug, descripcion: p.descripcion ?? '',
      datosUtiles: p.datosUtiles ?? '', infoEmbalaje: p.infoEmbalaje ?? '', garantia: p.garantia ?? '',
      precio: String(p.precio), precioOferta: p.precioOferta ? String(p.precioOferta) : '',
      categoriaId: String(p.categoriaId),
      subcategoriaId: p.subcategoriaId ? String(p.subcategoriaId) : '',
      stock: String(p.stock),
      destacado: p.destacado, novedad: p.novedad, enPromocion: p.enPromocion, activo: p.activo,
      imagenes: JSON.parse(p.imagenes || '[]'),
    })
    setEditing(p.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const body = { ...form, slug: form.slug || slugify(form.nombre) }
    const url = editing ? `/muebleuno/api/productos/${editing}` : '/muebleuno/api/productos'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (editing) {
      setProductos(prev => prev.map(p => p.id === editing ? data : p))
    } else {
      setProductos(prev => [data, ...prev])
    }
    setShowForm(false); setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/muebleuno/api/productos/${id}`, { method: 'DELETE' })
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-rojo-principal text-white px-4 py-2 rounded-lg hover:bg-rojo-hover transition-colors">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3">
        <input type="text" placeholder="Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1" />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gris-fondo border-b">
            <tr>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-left px-4 py-3">Categoría / Subcategoría</th>
              <th className="text-left px-4 py-3">Precio</th>
              <th className="text-left px-4 py-3">Stock</th>
              <th className="text-center px-4 py-3">Dest.</th>
              <th className="text-center px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtrados.map(p => {
              const imgs = JSON.parse(p.imagenes || '[]')
              return (
                <tr key={p.id} onClick={() => openEdit(p)} className="hover:bg-gris-fondo/50 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gris-fondo overflow-hidden shrink-0">
                        {imgs[0] && <img src={imgs[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium line-clamp-1">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gris-medio">{p.categoria.nombre}</span>
                    {p.subcategoria && (
                      <span className="text-xs text-gris-claro block">{p.subcategoria.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold">{formatPrice(p.precioOferta ?? p.precio)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    {p.destacado ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gris-claro mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.activo ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={e => { e.stopPropagation(); openEdit(p) }} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(p.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="text-center py-8 text-gris-medio">No hay productos</p>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gris-claro hover:text-gris-oscuro text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                  <label className="block text-sm font-medium mb-1">Categoría *</label>
                  <select
                    required
                    value={form.categoriaId}
                    onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value, subcategoriaId: '' }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoría</label>
                  <select
                    value={form.subcategoriaId}
                    onChange={e => setForm(f => ({ ...f, subcategoriaId: e.target.value }))}
                    disabled={!form.categoriaId || subcatsFiltradas.length === 0}
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gris-fondo disabled:text-gris-claro"
                  >
                    <option value="">Sin subcategoría</option>
                    {subcatsFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio *</label>
                  <input required type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio oferta</label>
                  <input type="number" min="0" step="0.01" value={form.precioOferta} onChange={e => setForm(f => ({ ...f, precioOferta: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {/* Ficha técnica */}
              <div className="border rounded-xl p-4 space-y-4 bg-gris-fondo/40">
                <p className="text-xs font-bold uppercase tracking-widest text-gris-medio">Ficha técnica del producto</p>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <p className="text-xs text-gris-claro mb-1.5">Texto libre con las características generales del producto. Podés usar párrafos separados con una línea en blanco.</p>
                  <textarea rows={4} value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder={"Rack de TV fabricado en melamina de alta calidad...\n\nCuenta con puertas con pistón a gas y bisagras de cierre suave."}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Datos útiles</label>
                  <p className="text-xs text-gris-claro mb-1.5">
                    Usá grupos separados por línea en blanco. La primera línea de cada grupo es el título (ej: &ldquo;Materiales&rdquo;) y las siguientes empiezan con <code className="bg-white px-1 rounded">-</code> para ser bullets.
                  </p>
                  <textarea rows={8} value={form.datosUtiles}
                    onChange={e => setForm(f => ({ ...f, datosUtiles: e.target.value }))}
                    placeholder={"Materiales\n- Estructura en melamina 25mm\n- Puertas en melamina 15mm\n\nMedidas del mueble\n- Ancho: 180 cm\n- Profundidad: 36,6 cm\n- Altura: 40 cm\n\nMedidas internas\n- Altura útil: 32 cm"}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Información del embalaje</label>
                  <p className="text-xs text-gris-claro mb-1.5">
                    Indicá si viene armado o desarmado, medidas del bulto y peso. Podés usar bullets con <code className="bg-white px-1 rounded">-</code>.
                  </p>
                  <textarea rows={5} value={form.infoEmbalaje}
                    onChange={e => setForm(f => ({ ...f, infoEmbalaje: e.target.value }))}
                    placeholder={"- Producto entregado desarmado en caja\n- Se entrega con QR de manual de armado\n\nMedidas del bulto\n- Largo: 181 cm / Ancho: 41 cm / Alto: 13 cm\n- Peso: 34 kg"}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Garantía</label>
                  <p className="text-xs text-gris-claro mb-1.5">Describí la cobertura de garantía: duración, qué incluye y cómo contactarse ante un problema.</p>
                  <textarea rows={3} value={form.garantia}
                    onChange={e => setForm(f => ({ ...f, garantia: e.target.value }))}
                    placeholder={"12 meses de garantía por defectos de fabricación. Ante cualquier inconveniente, contactanos por WhatsApp para coordinar el servicio técnico."}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <ImageUploader context="producto" images={form.imagenes} onChange={imgs => setForm(f => ({ ...f, imagenes: imgs }))} />

              <div className="flex flex-wrap gap-4">
                {([['destacado', 'Destacado'], ['novedad', 'Novedad'], ['enPromocion', 'En promoción'], ['activo', 'Activo']] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>

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
