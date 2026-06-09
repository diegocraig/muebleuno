'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Settings2 } from 'lucide-react'
import ImageUploader from './ImageUploader'

interface SliderItem {
  id: number; imagen: string; titulo?: string | null; subtitulo?: string | null
  linkUrl?: string | null; orden: number; activo: boolean
}

interface SliderConfig { intervalo: number; transicion: string }

const TRANSICIONES = [
  { value: 'fade',     label: 'Fundido',      desc: 'Desvanece suavemente entre slides' },
  { value: 'slide',    label: 'Deslizar',     desc: 'Desliza horizontalmente' },
  { value: 'zoom',     label: 'Zoom',         desc: 'Zoom desde el centro' },
  { value: 'flip',     label: 'Voltear',      desc: 'Gira el slide como una página' },
  { value: 'push',     label: 'Empujar',      desc: 'El nuevo slide empuja al anterior' },
]

const INTERVALOS = [3, 4, 5, 6, 7, 8, 10, 15]

const empty = { imagen: '', titulo: '', subtitulo: '', linkUrl: '', orden: '0', activo: true }

interface Props {
  items: SliderItem[]
  config: SliderConfig
}

export default function SliderAdmin({ items: initial, config: initialConfig }: Props) {
  const [items, setItems] = useState(initial)
  const [config, setConfig] = useState(initialConfig)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  const openNew = () => { setForm({ ...empty, orden: String(items.length) }); setEditing(null); setShowForm(true) }
  const openEdit = (item: SliderItem) => {
    setForm({ imagen: item.imagen, titulo: item.titulo ?? '', subtitulo: item.subtitulo ?? '',
      linkUrl: item.linkUrl ?? '', orden: String(item.orden), activo: item.activo })
    setEditing(item.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const url = editing ? `/api/slider/${editing}` : '/api/slider'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (editing) setItems(prev => prev.map(i => i.id === editing ? data : i))
    else setItems(prev => [...prev, data])
    setShowForm(false); setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este slide?')) return
    await fetch(`/api/slider/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const moveItem = async (id: number, dir: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id)
    if (idx + dir < 0 || idx + dir >= items.length) return
    const newItems = [...items]
    const [a, b] = [newItems[idx], newItems[idx + dir]]
    const tempOrden = a.orden; a.orden = b.orden; b.orden = tempOrden
    newItems[idx] = b; newItems[idx + dir] = a
    setItems(newItems)
    await Promise.all([
      fetch(`/api/slider/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...a, orden: a.orden }) }),
      fetch(`/api/slider/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, orden: b.orden }) }),
    ])
  }

  const saveConfig = async () => {
    setSavingConfig(true)
    await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sliderIntervalo: config.intervalo, sliderTransicion: config.transicion }),
    })
    setSavingConfig(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2500)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Slider</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-rojo-principal text-white px-4 py-2 rounded-lg hover:bg-rojo-hover">
          <Plus className="w-4 h-4" /> Nuevo slide
        </button>
      </div>

      {/* Configuración global del slider */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-rojo-principal" />
          <h2 className="font-semibold text-sm">Configuración del slider</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo entre slides</label>
            <div className="flex flex-wrap gap-2">
              {INTERVALOS.map(s => (
                <button key={s} type="button"
                  onClick={() => setConfig(c => ({ ...c, intervalo: s }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    config.intervalo === s
                      ? 'bg-rojo-principal text-white border-rojo-principal'
                      : 'border-gray-200 hover:border-rojo-principal hover:text-rojo-principal'
                  }`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de transición</label>
            <div className="space-y-1.5">
              {TRANSICIONES.map(t => (
                <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="transicion" value={t.value}
                    checked={config.transicion === t.value}
                    onChange={() => setConfig(c => ({ ...c, transicion: t.value }))}
                    className="accent-rojo-principal" />
                  <div>
                    <span className="text-sm font-medium group-hover:text-rojo-principal transition-colors">{t.label}</span>
                    <span className="text-xs text-gris-claro ml-2">{t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveConfig} disabled={savingConfig}
            className="bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            {savingConfig ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {configSaved && <span className="text-green-600 text-sm font-medium">✓ Guardado</span>}
        </div>
      </div>

      {/* Lista de slides */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-gris-fondo shrink-0">
              {item.imagen && <img src={item.imagen} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.titulo || '(sin título)'}</p>
              {item.subtitulo && <p className="text-sm text-gris-medio">{item.subtitulo}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => moveItem(item.id, -1)} disabled={idx === 0} className="p-1.5 hover:bg-gris-fondo rounded disabled:opacity-30">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveItem(item.id, 1)} disabled={idx === items.length - 1} className="p-1.5 hover:bg-gris-fondo rounded disabled:opacity-30">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-gris-medio">No hay slides</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Editar slide' : 'Nuevo slide'}</h2>
              <button onClick={() => setShowForm(false)} className="text-xl text-gris-claro">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <ImageUploader context="slider" images={form.imagen ? [form.imagen] : []} onChange={imgs => setForm(f => ({ ...f, imagen: imgs[0] ?? '' }))} />
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input value={form.subtitulo} onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Al hacer clic, ir a...</label>
                <select value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Sin enlace</option>
                  <option value="/productos">Todos los productos</option>
                  <option value="/novedades">Novedades</option>
                  <option value="/promociones">Promociones</option>
                  <option value="/categoria/living">Categoría: Living</option>
                  <option value="/categoria/dormitorio">Categoría: Dormitorio</option>
                  <option value="/categoria/comedor">Categoría: Comedor</option>
                  <option value="/categoria/cocina">Categoría: Cocina</option>
                  <option value="/categoria/oficina">Categoría: Oficina</option>
                  <option value="/categoria/exterior">Categoría: Exterior</option>
                  <option value="/contacto">Contacto</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                <span className="text-sm">Activo</span>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-2.5 rounded-lg">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 border rounded-lg hover:bg-gris-fondo text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
