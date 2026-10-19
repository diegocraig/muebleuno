'use client'
import { Plus, Trash2, ChevronUp, ChevronDown, Palette } from 'lucide-react'
import ImageUploader from './ImageUploader'
import { MAX_NOMBRE_COLOR } from '@/lib/colores'

export interface ColorForm {
  key: string
  id?: number
  nombre: string
  hex: string
  usarHex: boolean
  imagenes: string[]
  stock: string
}

let seq = 0
export const nuevaKey = () => `c${Date.now()}-${seq++}`

export function colorFormDesdeDb(c: { id: number; nombre: string; hex?: string | null; imagenes: string; stock: number }): ColorForm {
  return {
    key: nuevaKey(),
    id: c.id,
    nombre: c.nombre,
    hex: c.hex ?? '#808080',
    usarHex: !!c.hex,
    imagenes: JSON.parse(c.imagenes || '[]'),
    stock: String(c.stock),
  }
}

/** Lo que espera la API de productos en `colores`. */
export const coloresParaApi = (colores: ColorForm[]) =>
  colores.map(c => ({
    id: c.id,
    nombre: c.nombre.trim(),
    hex: c.usarHex ? c.hex : null,
    imagenes: c.imagenes,
    stock: parseInt(c.stock) || 0,
  }))

// onChange recibe un updater: las fotos terminan de subir de forma asíncrona y
// no deben pisar lo que se editó mientras tanto en otro campo o color.
type Updater = (fn: (prev: ColorForm[]) => ColorForm[]) => void

export default function ColoresEditor({ colores, onChange }: { colores: ColorForm[]; onChange: Updater }) {
  const update = (key: string, patch: Partial<ColorForm>) =>
    onChange(prev => prev.map(c => (c.key === key ? { ...c, ...patch } : c)))

  const mover = (idx: number, dir: -1 | 1) => {
    onChange(prev => {
      const to = idx + dir
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
  }

  const agregar = () =>
    onChange(prev => [...prev, { key: nuevaKey(), nombre: '', hex: '#808080', usarHex: false, imagenes: [], stock: '0' }])

  const eliminar = (c: ColorForm) => {
    if (c.imagenes.length && !confirm(`¿Eliminar el color "${c.nombre || 'sin nombre'}" y sus fotos?`)) return
    onChange(prev => prev.filter(x => x.key !== c.key))
  }

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-gris-fondo/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gris-medio flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Colores
          </p>
          <p className="text-xs text-gris-claro mt-1">
            Opcional. Si cargás colores, el cliente elige uno al comprar y ve las fotos de ese color.
            El stock del producto pasa a ser la suma del stock de cada color.
          </p>
        </div>
        <button type="button" onClick={agregar}
          className="shrink-0 flex items-center gap-1.5 text-sm border border-rojo-principal text-rojo-principal hover:bg-rojo-principal hover:text-white px-3 py-1.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Agregar color
        </button>
      </div>

      {colores.map((c, idx) => (
        <div key={c.key} className="bg-white border rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <button type="button" onClick={() => mover(idx, -1)} disabled={idx === 0}
                className="p-0.5 text-gris-medio hover:text-gris-oscuro disabled:opacity-25" title="Subir">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => mover(idx, 1)} disabled={idx === colores.length - 1}
                className="p-0.5 text-gris-medio hover:text-gris-oscuro disabled:opacity-25" title="Bajar">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <span
              className="w-9 h-9 rounded-full border shrink-0 bg-gris-fondo bg-cover bg-center"
              style={c.usarHex ? { backgroundColor: c.hex } : c.imagenes[0] ? { backgroundImage: `url(${c.imagenes[0]})` } : undefined}
            />
            <input
              required
              maxLength={MAX_NOMBRE_COLOR}
              value={c.nombre}
              onChange={e => update(c.key, { nombre: e.target.value })}
              placeholder="Nombre del color (ej: Verde olivo)"
              className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => eliminar(c)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Eliminar color">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-8">
            <label className="flex items-center gap-2 text-sm">
              Stock
              <input type="number" min="0" value={c.stock}
                onChange={e => update(c.key, { stock: e.target.value })}
                className="w-20 border rounded-lg px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={c.usarHex} onChange={e => update(c.key, { usarHex: e.target.checked })} />
              Muestra de color
            </label>
            {c.usarHex && (
              <input type="color" value={c.hex} onChange={e => update(c.key, { hex: e.target.value })}
                className="w-10 h-8 border rounded cursor-pointer" title="Elegí el color de la muestra" />
            )}
            {!c.usarHex && <span className="text-xs text-gris-claro">Sin muestra se usa la primera foto como miniatura.</span>}
          </div>

          <div className="pl-8">
            <ImageUploader compact context="producto" images={c.imagenes} onChange={imgs => update(c.key, { imagenes: imgs })} />
            {c.imagenes.length === 0 && <p className="text-xs text-orange-500 mt-1">Cargá al menos una foto de este color.</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
