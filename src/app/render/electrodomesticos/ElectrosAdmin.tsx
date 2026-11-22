'use client'
import { useMemo, useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ElectroCatalogo, TipoElectro } from '@/lib/render/tipos'
import { NOMBRE_ELECTRO } from '@/lib/render/tipos'
import { cn } from '@/lib/utils'

type Borrador = Omit<ElectroCatalogo, 'id'> & { id?: number }
const VACIO: Borrador = { tipo: 'heladera', marca: '', modelo: '', ancho: 60, alto: 170, profundidad: 65, caladoAncho: null, caladoProf: null, acabado: 'inox', empotrable: false, precio: null, fuente: null, verificado: false }

export default function ElectrosAdmin({ inicial }: { inicial: ElectroCatalogo[] }) {
  const [lista, setLista] = useState(inicial)
  const [tipo, setTipo] = useState<TipoElectro | 'todos'>('todos')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Borrador | null>(null)
  const [error, setError] = useState('')

  const filtrada = useMemo(() => lista.filter(e =>
    (tipo === 'todos' || e.tipo === tipo) && (!q || `${e.marca} ${e.modelo}`.toLowerCase().includes(q.toLowerCase()))), [lista, tipo, q])

  const guardar = async () => {
    if (!edit) return
    setError('')
    const r = await fetch(edit.id ? `/api/render/electrodomesticos/${edit.id}` : '/api/render/electrodomesticos', {
      method: edit.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit),
    })
    const j = await r.json()
    if (!r.ok) { setError(j.error ?? 'Error'); return }
    setLista(l => edit.id ? l.map(x => x.id === j.id ? j : x) : [...l, j])
    setEdit(null)
  }
  const borrar = async (e: ElectroCatalogo) => {
    if (!confirm(`¿Quitar ${e.marca} ${e.modelo} de la base?`)) return
    await fetch(`/api/render/electrodomesticos/${e.id}`, { method: 'DELETE' })
    setLista(l => l.filter(x => x.id !== e.id))
  }
  const campo = (k: keyof Borrador, tipoInput: 'text' | 'number' = 'number', ph = '') => (
    <input type={tipoInput} placeholder={ph} value={(edit?.[k] as string | number | null) ?? ''}
      onChange={ev => setEdit(b => b && ({ ...b, [k]: tipoInput === 'number' ? (ev.target.value === '' ? null : Number(ev.target.value)) : ev.target.value }))}
      className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-rojo-principal focus:outline-none" />
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['todos', ...Object.keys(NOMBRE_ELECTRO)] as (TipoElectro | 'todos')[]).map(t => (
          <button key={t} type="button" onClick={() => setTipo(t)}
            className={cn('rounded-full px-3 py-1 text-xs font-semibold', tipo === t ? 'bg-rojo-principal text-white' : 'bg-white text-gris-medio hover:text-gris-oscuro')}>
            {t === 'todos' ? `Todos (${lista.length})` : `${NOMBRE_ELECTRO[t]} (${lista.filter(e => e.tipo === t).length})`}
          </button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar marca o modelo…" className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-rojo-principal focus:outline-none" />
        <button type="button" onClick={() => setEdit({ ...VACIO, tipo: tipo === 'todos' ? 'heladera' : tipo })} className="inline-flex items-center gap-1 rounded-lg bg-rojo-principal px-3 py-1.5 text-sm font-semibold text-white hover:bg-rojo-hover"><Plus className="h-4 w-4" /> Agregar modelo</button>
      </div>

      {edit && (
        <div className="mb-4 rounded-xl border border-rojo-principal/30 bg-white p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="text-xs text-gris-medio">Tipo
              <select value={edit.tipo} onChange={e => setEdit({ ...edit, tipo: e.target.value as TipoElectro })} className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm">
                {Object.entries(NOMBRE_ELECTRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-xs text-gris-medio">Marca{campo('marca', 'text')}</label>
            <label className="text-xs text-gris-medio sm:col-span-2">Modelo{campo('modelo', 'text')}</label>
            <label className="text-xs text-gris-medio">Ancho (cm){campo('ancho')}</label>
            <label className="text-xs text-gris-medio">Alto (cm){campo('alto')}</label>
            <label className="text-xs text-gris-medio">Profundidad (cm){campo('profundidad')}</label>
            <label className="text-xs text-gris-medio">Acabado
              <select value={edit.acabado} onChange={e => setEdit({ ...edit, acabado: e.target.value as Borrador['acabado'] })} className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm">
                {['inox', 'blanco', 'negro', 'gris', 'otro'].map(a => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label className="text-xs text-gris-medio">Calado ancho{campo('caladoAncho')}</label>
            <label className="text-xs text-gris-medio">Calado prof.{campo('caladoProf')}</label>
            <label className="text-xs text-gris-medio">Precio ref. ($){campo('precio')}</label>
            <label className="flex items-end gap-2 pb-1 text-sm"><input type="checkbox" checked={edit.empotrable} onChange={e => setEdit({ ...edit, empotrable: e.target.checked })} className="accent-rojo-principal" /> Empotrable</label>
            <label className="text-xs text-gris-medio sm:col-span-3">Fuente (URL de la ficha){campo('fuente', 'text', 'https://…')}</label>
            <label className="flex items-end gap-2 pb-1 text-sm"><input type="checkbox" checked={edit.verificado} onChange={e => setEdit({ ...edit, verificado: e.target.checked })} className="accent-rojo-principal" /> Verificado</label>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setEdit(null)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gris-medio hover:bg-gris-fondo">Cancelar</button>
            <button type="button" onClick={guardar} className="rounded-lg bg-rojo-principal px-4 py-1.5 text-sm font-semibold text-white hover:bg-rojo-hover">Guardar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gris-fondo text-left text-xs uppercase text-gris-medio">
            <tr><th className="px-3 py-2">Tipo</th><th>Marca</th><th>Modelo</th><th className="text-right">An × Al × Pr</th><th className="text-right">Calado</th><th>Acabado</th><th></th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrada.map(e => (
              <tr key={e.id} className="hover:bg-gris-fondo/50">
                <td className="px-3 py-1.5 text-gris-medio">{NOMBRE_ELECTRO[e.tipo]}</td>
                <td className="font-semibold">{e.marca}</td>
                <td>{e.modelo}</td>
                <td className="text-right tabular-nums">{e.ancho} × {e.alto} × {e.profundidad}</td>
                <td className="text-right tabular-nums text-gris-medio">{e.caladoAncho ? `${e.caladoAncho} × ${e.caladoProf}` : ''}</td>
                <td className="text-gris-medio">{e.acabado}{e.empotrable ? ' · emp.' : ''}</td>
                <td className="whitespace-nowrap">
                  {e.verificado ? <span className="text-green-700">✓</span> : <span className="text-xs text-gris-claro">ref.</span>}
                  {e.fuente && <a href={e.fuente} target="_blank" rel="noopener noreferrer" className="ml-2 inline-block text-gris-claro hover:text-rojo-principal" title={e.fuente}><ExternalLink className="h-3.5 w-3.5" /></a>}
                </td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <button type="button" onClick={() => setEdit(e)} className="p-1 text-gris-claro hover:text-gris-oscuro"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => borrar(e)} className="p-1 text-gris-claro hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
