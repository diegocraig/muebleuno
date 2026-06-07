'use client'
import { useState, useRef } from 'react'
import { Plus, Trash2, Save, Upload, X } from 'lucide-react'

interface Config {
  heroBadge: string; heroTitulo: string; heroDescripcion: string; whatsappMsg: string
  edificiosTitulo: string; edificiosDesc: string; edificiosItems: string
  stat1Numero: string; stat1Texto: string; stat2Numero: string; stat2Texto: string
  stat3Numero: string; stat3Texto: string; ctaTitulo: string; ctaDescripcion: string
}
interface Servicio { id: number; titulo: string; descripcion: string; items: string; activo: boolean }
interface Paso { id: number; numero: string; titulo: string; texto: string }
interface Material { id: number; nombre: string; detalle: string }
interface Foto { id: number; imagen: string; titulo: string | null; activo: boolean }

type Tab = 'general' | 'servicios' | 'pasos' | 'materiales' | 'fotos'

const tabs: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'pasos', label: 'Proceso' },
  { key: 'materiales', label: 'Materiales' },
  { key: 'fotos', label: 'Fotos / Carrusel' },
]

/* ── helpers ── */
function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rojo-principal'
  return (
    <div>
      <label className="block text-xs font-semibold text-gris-medio mb-1">{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={cls + ' resize-y'} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  )
}

/* ── Tab General ── */
function TabGeneral({ config: initial }: { config: Config }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const set = (k: keyof Config) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const save = async () => {
    setSaving(true)
    await fetch('/muebleuno/api/medida/config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOk(true); setTimeout(() => setOk(false), 2000)
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold">Hero</h3>
        <Field label="Badge" value={form.heroBadge} onChange={set('heroBadge')} />
        <Field label="Título" value={form.heroTitulo} onChange={set('heroTitulo')} textarea />
        <Field label="Descripción" value={form.heroDescripcion} onChange={set('heroDescripcion')} textarea />
        <Field label="Mensaje WhatsApp" value={form.whatsappMsg} onChange={set('whatsappMsg')} />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold">Sección Edificios</h3>
        <Field label="Título" value={form.edificiosTitulo} onChange={set('edificiosTitulo')} />
        <Field label="Descripción" value={form.edificiosDesc} onChange={set('edificiosDesc')} textarea />
        <div>
          <label className="block text-xs font-semibold text-gris-medio mb-1">Items (uno por línea)</label>
          <textarea rows={5} value={(JSON.parse(form.edificiosItems || '[]') as string[]).join('\n')}
            onChange={e => set('edificiosItems')(JSON.stringify(e.target.value.split('\n').filter(Boolean)))}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-rojo-principal" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold">Estadísticas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Número 1" value={form.stat1Numero} onChange={set('stat1Numero')} />
          <Field label="Texto 1" value={form.stat1Texto} onChange={set('stat1Texto')} />
          <Field label="Número 2" value={form.stat2Numero} onChange={set('stat2Numero')} />
          <Field label="Texto 2" value={form.stat2Texto} onChange={set('stat2Texto')} />
          <Field label="Número 3" value={form.stat3Numero} onChange={set('stat3Numero')} />
          <Field label="Texto 3" value={form.stat3Texto} onChange={set('stat3Texto')} />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold">CTA Final</h3>
        <Field label="Título" value={form.ctaTitulo} onChange={set('ctaTitulo')} />
        <Field label="Descripción" value={form.ctaDescripcion} onChange={set('ctaDescripcion')} textarea />
      </div>
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-lg">
        <Save className="w-4 h-4" /> {ok ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}

/* ── Tab Servicios ── */
function TabServicios({ servicios: initial }: { servicios: Servicio[] }) {
  const [servicios, setServicios] = useState(initial)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ titulo: '', descripcion: '', itemsText: '', activo: true })
  const [adding, setAdding] = useState(false)

  const startEdit = (s: Servicio) => {
    setEditId(s.id)
    setForm({ titulo: s.titulo, descripcion: s.descripcion, itemsText: (JSON.parse(s.items) as string[]).join('\n'), activo: s.activo })
    setAdding(false)
  }
  const save = async () => {
    const payload = { titulo: form.titulo, descripcion: form.descripcion, items: form.itemsText.split('\n').filter(Boolean), activo: form.activo }
    if (adding) {
      const res = await fetch('/muebleuno/api/medida/servicios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const nuevo = await res.json()
      setServicios(prev => [...prev, nuevo])
    } else {
      await fetch(`/muebleuno/api/medida/servicios/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setServicios(prev => prev.map(s => s.id === editId ? { ...s, ...payload, items: JSON.stringify(payload.items) } : s))
    }
    setEditId(null); setAdding(false)
  }
  const del = async (id: number) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await fetch(`/muebleuno/api/medida/servicios/${id}`, { method: 'DELETE' })
    setServicios(prev => prev.filter(s => s.id !== id))
  }
  const editing = editId !== null || adding

  return (
    <div className="max-w-3xl space-y-4">
      {!editing && (
        <button onClick={() => { setAdding(true); setForm({ titulo: '', descripcion: '', itemsText: '', activo: true }) }}
          className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-4 py-2 rounded-lg hover:bg-rojo-hover">
          <Plus className="w-4 h-4" /> Agregar servicio
        </button>
      )}
      {editing && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4 border-2 border-rojo-principal">
          <h3 className="font-bold">{adding ? 'Nuevo servicio' : 'Editar servicio'}</h3>
          <Field label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} />
          <Field label="Descripción" value={form.descripcion} onChange={v => setForm(f => ({ ...f, descripcion: v }))} textarea />
          <div>
            <label className="block text-xs font-semibold text-gris-medio mb-1">Items (uno por línea)</label>
            <textarea rows={5} value={form.itemsText} onChange={e => setForm(f => ({ ...f, itemsText: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-rojo-principal" />
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-5 py-2 rounded-lg hover:bg-rojo-hover">
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={() => { setEditId(null); setAdding(false) }} className="px-5 py-2 border rounded-lg hover:bg-gris-fondo text-sm">Cancelar</button>
          </div>
        </div>
      )}
      {servicios.map(s => (
        <div key={s.id} className={`bg-white rounded-xl p-5 shadow-sm flex justify-between items-start gap-4 ${!s.activo ? 'opacity-50' : ''}`}>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{s.titulo}</p>
            <p className="text-sm text-gris-medio line-clamp-2 mt-0.5">{s.descripcion}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => startEdit(s)} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gris-fondo">Editar</button>
            <button onClick={() => del(s.id)} className="text-red-500 hover:text-red-700 p-1.5"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Tab Pasos ── */
function TabPasos({ pasos: initial }: { pasos: Paso[] }) {
  const [pasos, setPasos] = useState(initial)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ numero: '', titulo: '', texto: '' })
  const [adding, setAdding] = useState(false)

  const startEdit = (p: Paso) => { setEditId(p.id); setForm({ numero: p.numero, titulo: p.titulo, texto: p.texto }); setAdding(false) }
  const save = async () => {
    if (adding) {
      const res = await fetch('/muebleuno/api/medida/pasos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const nuevo = await res.json()
      setPasos(prev => [...prev, nuevo])
    } else {
      await fetch(`/muebleuno/api/medida/pasos/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setPasos(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p))
    }
    setEditId(null); setAdding(false)
  }
  const del = async (id: number) => {
    if (!confirm('¿Eliminar este paso?')) return
    await fetch(`/muebleuno/api/medida/pasos/${id}`, { method: 'DELETE' })
    setPasos(prev => prev.filter(p => p.id !== id))
  }
  const editing = editId !== null || adding

  return (
    <div className="max-w-2xl space-y-4">
      {!editing && (
        <button onClick={() => { setAdding(true); setForm({ numero: String(pasos.length + 1).padStart(2, '0'), titulo: '', texto: '' }) }}
          className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-4 py-2 rounded-lg hover:bg-rojo-hover">
          <Plus className="w-4 h-4" /> Agregar paso
        </button>
      )}
      {editing && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4 border-2 border-rojo-principal">
          <h3 className="font-bold">{adding ? 'Nuevo paso' : 'Editar paso'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Número" value={form.numero} onChange={v => setForm(f => ({ ...f, numero: v }))} />
            <div className="col-span-2"><Field label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} /></div>
          </div>
          <Field label="Descripción" value={form.texto} onChange={v => setForm(f => ({ ...f, texto: v }))} textarea />
          <div className="flex gap-3">
            <button onClick={save} className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-5 py-2 rounded-lg hover:bg-rojo-hover"><Save className="w-4 h-4" /> Guardar</button>
            <button onClick={() => { setEditId(null); setAdding(false) }} className="px-5 py-2 border rounded-lg hover:bg-gris-fondo text-sm">Cancelar</button>
          </div>
        </div>
      )}
      {pasos.map(p => (
        <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm flex items-start gap-4">
          <span className="text-2xl font-black text-rojo-principal/30 leading-none shrink-0">{p.numero}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{p.titulo}</p>
            <p className="text-sm text-gris-medio mt-0.5 line-clamp-2">{p.texto}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => startEdit(p)} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gris-fondo">Editar</button>
            <button onClick={() => del(p.id)} className="text-red-500 hover:text-red-700 p-1.5"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Tab Materiales ── */
function TabMateriales({ materiales: initial }: { materiales: Material[] }) {
  const [materiales, setMateriales] = useState(initial)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ nombre: '', detalle: '' })
  const [adding, setAdding] = useState(false)

  const startEdit = (m: Material) => { setEditId(m.id); setForm({ nombre: m.nombre, detalle: m.detalle }); setAdding(false) }
  const save = async () => {
    if (adding) {
      const res = await fetch('/muebleuno/api/medida/materiales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const nuevo = await res.json()
      setMateriales(prev => [...prev, nuevo])
    } else {
      await fetch(`/muebleuno/api/medida/materiales/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setMateriales(prev => prev.map(m => m.id === editId ? { ...m, ...form } : m))
    }
    setEditId(null); setAdding(false)
  }
  const del = async (id: number) => {
    if (!confirm('¿Eliminar este material?')) return
    await fetch(`/muebleuno/api/medida/materiales/${id}`, { method: 'DELETE' })
    setMateriales(prev => prev.filter(m => m.id !== id))
  }
  const editing = editId !== null || adding

  return (
    <div className="max-w-2xl space-y-4">
      {!editing && (
        <button onClick={() => { setAdding(true); setForm({ nombre: '', detalle: '' }) }}
          className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-4 py-2 rounded-lg hover:bg-rojo-hover">
          <Plus className="w-4 h-4" /> Agregar material
        </button>
      )}
      {editing && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4 border-2 border-rojo-principal">
          <h3 className="font-bold">{adding ? 'Nuevo material' : 'Editar material'}</h3>
          <Field label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
          <Field label="Detalle" value={form.detalle} onChange={v => setForm(f => ({ ...f, detalle: v }))} textarea />
          <div className="flex gap-3">
            <button onClick={save} className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-5 py-2 rounded-lg hover:bg-rojo-hover"><Save className="w-4 h-4" /> Guardar</button>
            <button onClick={() => { setEditId(null); setAdding(false) }} className="px-5 py-2 border rounded-lg hover:bg-gris-fondo text-sm">Cancelar</button>
          </div>
        </div>
      )}
      {materiales.map(m => (
        <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold">{m.nombre}</p>
            <p className="text-sm text-gris-medio mt-0.5">{m.detalle}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => startEdit(m)} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gris-fondo">Editar</button>
            <button onClick={() => del(m.id)} className="text-red-500 hover:text-red-700 p-1.5"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Tab Fotos ── */
function TabFotos({ fotos: initial }: { fotos: Foto[] }) {
  const [fotos, setFotos] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file)
      const upRes = await fetch('/muebleuno/api/upload', { method: 'POST', body: fd })
      const { url } = await upRes.json()
      const res = await fetch('/muebleuno/api/medida/fotos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagen: url }),
      })
      const nueva = await res.json()
      setFotos(prev => [...prev, nueva])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const del = async (id: number) => {
    if (!confirm('¿Eliminar esta foto?')) return
    await fetch(`/muebleuno/api/medida/fotos/${id}`, { method: 'DELETE' })
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 bg-rojo-principal text-white font-bold px-4 py-2.5 rounded-lg hover:bg-rojo-hover disabled:opacity-60">
          <Upload className="w-4 h-4" /> {uploading ? 'Subiendo...' : 'Subir fotos'}
        </button>
        <span className="text-sm text-gris-medio">{fotos.length} foto{fotos.length !== 1 ? 's' : ''} en el carrusel</span>
      </div>
      {fotos.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center text-gris-medio">
          <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Todavía no hay fotos. Subí la primera para activar el carrusel en la página.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map(f => (
            <div key={f.id} className="relative group rounded-xl overflow-hidden bg-gris-fondo aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imagen} alt={f.titulo ?? ''} className="w-full h-full object-cover" />
              <button onClick={() => del(f.id)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
              {f.titulo && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{f.titulo}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Root ── */
export default function MedidaAdmin({ config, servicios, pasos, materiales, fotos }: {
  config: Config; servicios: Servicio[]; pasos: Paso[]; materiales: Material[]; fotos: Foto[]
}) {
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Muebles a Medida</h1>
      <div className="flex gap-1 mb-8 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-rojo-principal text-rojo-principal' : 'border-transparent text-gris-medio hover:text-gris-oscuro'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'general'    && <TabGeneral config={config} />}
      {tab === 'servicios'  && <TabServicios servicios={servicios} />}
      {tab === 'pasos'      && <TabPasos pasos={pasos} />}
      {tab === 'materiales' && <TabMateriales materiales={materiales} />}
      {tab === 'fotos'      && <TabFotos fotos={fotos} />}
    </div>
  )
}
