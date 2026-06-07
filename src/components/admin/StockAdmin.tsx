'use client'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Save } from 'lucide-react'

interface Producto {
  id: number
  nombre: string
  stock: number
  precio: number
  precioOferta: number | null
  activo: boolean
  categoria: { nombre: string }
}

type SortKey = 'nombre' | 'categoria' | 'stock' | 'precio'
type SortDir = 'asc' | 'desc'

interface EditCell { id: number; field: 'stock' | 'precio' | 'precioOferta'; value: string }

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
}

export default function StockAdmin({ productos: initial }: { productos: Producto[] }) {
  const [productos, setProductos] = useState(initial)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editing, setEditing] = useState<EditCell | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  const categorias = useMemo(() => {
    const set = new Set(initial.map(p => p.categoria.nombre))
    return Array.from(set).sort()
  }, [initial])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtrados = useMemo(() => {
    let list = [...productos]
    if (busqueda) list = list.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    if (filtroCategoria) list = list.filter(p => p.categoria.nombre === filtroCategoria)
    if (filtroStock === 'sin') list = list.filter(p => p.stock === 0)
    if (filtroStock === 'bajo') list = list.filter(p => p.stock > 0 && p.stock <= 5)
    if (filtroStock === 'ok') list = list.filter(p => p.stock > 5)
    list.sort((a, b) => {
      let va: string | number, vb: string | number
      if (sortKey === 'categoria') { va = a.categoria.nombre; vb = b.categoria.nombre }
      else { va = a[sortKey]; vb = b[sortKey] }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [productos, busqueda, filtroCategoria, filtroStock, sortKey, sortDir])

  const startEdit = (id: number, field: EditCell['field'], value: number | null) => {
    setEditing({ id, field, value: value === null ? '' : String(value) })
  }

  const cancelEdit = () => setEditing(null)

  const saveEdit = async () => {
    if (!editing) return
    setSaving(editing.id)
    const payload: Record<string, unknown> = { id: editing.id, [editing.field]: editing.value }
    const res = await fetch('/muebleuno/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      setProductos(prev => prev.map(p => p.id === updated.id ? { ...p, stock: updated.stock, precio: updated.precio, precioOferta: updated.precioOferta } : p))
    }
    setSaving(null)
    setEditing(null)
  }

  const Cell = ({ prod, field }: { prod: Producto; field: EditCell['field'] }) => {
    const isEditing = editing?.id === prod.id && editing?.field === field
    const rawValue = field === 'precioOferta' ? prod.precioOferta : prod[field as 'stock' | 'precio']

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="number"
            value={editing.value}
            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
            className="w-24 border border-rojo-principal rounded px-2 py-0.5 text-sm focus:outline-none"
          />
          <button onClick={saveEdit} disabled={saving === prod.id}
            className="text-green-600 hover:text-green-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={cancelEdit} className="text-gris-medio hover:text-gris-oscuro text-lg leading-none">✕</button>
        </div>
      )
    }

    return (
      <button
        onClick={() => startEdit(prod.id, field, rawValue as number | null)}
        className="text-left hover:bg-rojo-suave rounded px-2 py-0.5 transition-colors cursor-pointer group w-full"
        title="Click para editar"
      >
        <span className={field === 'stock' && (rawValue as number) === 0 ? 'text-red-600 font-semibold' : field === 'stock' && (rawValue as number) <= 5 ? 'text-yellow-600 font-semibold' : ''}>
          {field === 'stock'
            ? rawValue as number
            : rawValue === null || rawValue === undefined
              ? <span className="text-gris-claro italic text-xs">—</span>
              : `$${(rawValue as number).toLocaleString('es-AR')}`
          }
        </span>
        <span className="ml-1 opacity-0 group-hover:opacity-60 text-xs">✎</span>
      </button>
    )
  }

  const ThSort = ({ col, label }: { col: SortKey; label: string }) => (
    <th className="text-left px-3 py-3 cursor-pointer select-none" onClick={() => toggleSort(col)}>
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </div>
    </th>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <h1 className="text-2xl font-bold mr-auto">Stock & Precios</h1>
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-52"
        />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todo el stock</option>
          <option value="sin">Sin stock (0)</option>
          <option value="bajo">Stock bajo (1–5)</option>
          <option value="ok">Stock OK (&gt;5)</option>
        </select>
        <span className="text-sm text-gris-medio">{filtrados.length} productos</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gris-fondo border-b">
              <tr>
                <ThSort col="nombre" label="Producto" />
                <ThSort col="categoria" label="Categoría" />
                <ThSort col="stock" label="Stock" />
                <ThSort col="precio" label="Precio" />
                <th className="text-left px-3 py-3">Precio oferta</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map(p => (
                <tr key={p.id} className={`hover:bg-gris-fondo/40 ${!p.activo ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2.5 font-medium max-w-[220px] truncate" title={p.nombre}>
                    {p.nombre}
                    {!p.activo && <span className="ml-2 text-xs text-gris-medio">(inactivo)</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gris-medio">{p.categoria.nombre}</td>
                  <td className="px-3 py-2.5 w-28"><Cell prod={p} field="stock" /></td>
                  <td className="px-3 py-2.5 w-36"><Cell prod={p} field="precio" /></td>
                  <td className="px-3 py-2.5 w-36"><Cell prod={p} field="precioOferta" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="text-center py-10 text-gris-medio">Sin resultados</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gris-medio mt-3">Click en cualquier valor de stock o precio para editarlo directamente.</p>
    </div>
  )
}
