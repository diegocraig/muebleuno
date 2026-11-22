'use client'
import { useMemo, useState } from 'react'
import { BadgeCheck, Box, Plus, Search, Sparkles, Wand2 } from 'lucide-react'
import type { Pared, ProductoCatalogo, TipoElectro, Ubicacion } from '@/lib/render/tipos'
import { NOMBRE_ELECTRO, NOMBRE_PARED } from '@/lib/render/tipos'
import { formatPrice, cn } from '@/lib/utils'
import { useRender } from './store'
import { Boton, Pestanas, Selector } from './ui'

const GRUPOS: { valor: ProductoCatalogo['grupo'] | 'todos'; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'bajo', texto: 'Bajo mesada' },
  { valor: 'alacena', texto: 'Alacenas' },
  { valor: 'alto', texto: 'Columnas' },
  { valor: 'combo', texto: 'Combos' },
  { valor: 'esquinero', texto: 'Esquineros' },
  { valor: 'ajuste', texto: 'Ajustes' },
]

function dims(p: ProductoCatalogo) {
  const d = p.def ?? p.combo?.componentes[0]
  if (!d) return 'sin medidas'
  return `${d.ancho} × ${d.alto} × ${d.profundidad}`
}

function Tarjeta({ p }: { p: ProductoCatalogo }) {
  const agregar = useRender(s => s.agregarProducto)
  const sinMedidas = !p.def && !p.combo
  return (
    <button
      type="button"
      onClick={() => agregar(p)}
      disabled={sinMedidas}
      className="group flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white p-2 text-left transition-all hover:border-rojo-principal hover:shadow-sm disabled:opacity-40"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gris-fondo">
        {p.imagen
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.imagen} alt="" className="h-full w-full object-cover" loading="lazy" />
          : <Box className="m-4 h-6 w-6 text-gris-claro" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-gris-oscuro">{p.nombre}</p>
        <p className="mt-0.5 text-[11px] text-gris-medio">{dims(p)} cm{p.ajustado && <span className="ml-1 text-rojo-principal">· ajustado</span>}</p>
        <p className="text-sm font-bold text-rojo-principal">
          {formatPrice(p.precio)}
          {p.precioLista > p.precio && <span className="ml-1 text-[11px] font-normal text-gris-claro line-through">{formatPrice(p.precioLista)}</span>}
        </p>
      </div>
      <Plus className="h-4 w-4 shrink-0 text-gris-claro group-hover:text-rojo-principal" />
    </button>
  )
}

function Muebles() {
  const catalogo = useRender(s => s.catalogo)
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]['valor']>('todos')
  const [q, setQ] = useState('')
  const lista = useMemo(() => {
    const t = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return catalogo.filter(p =>
      (grupo === 'todos' || p.grupo === grupo) &&
      (!t || p.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(t)))
  }, [catalogo, grupo, q])
  return (
    <>
      <div className="space-y-2 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gris-claro" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar mueble…" className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-sm focus:border-rojo-principal focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1">
          {GRUPOS.map(g => (
            <button key={g.valor} type="button" onClick={() => setGrupo(g.valor)}
              className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', grupo === g.valor ? 'bg-rojo-principal text-white' : 'bg-gris-fondo text-gris-medio hover:text-gris-oscuro')}>
              {g.texto}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {lista.map(p => <Tarjeta key={p.id} p={p} />)}
        {!lista.length && <p className="py-8 text-center text-sm text-gris-claro">Sin resultados</p>}
      </div>
    </>
  )
}

function Electros() {
  const electros = useRender(s => s.electros)
  const agregar = useRender(s => s.agregarElectro)
  const [tipo, setTipo] = useState<TipoElectro>('heladera')
  const [q, setQ] = useState('')
  const lista = electros.filter(e => e.tipo === tipo && (!q || `${e.marca} ${e.modelo}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <>
      <div className="space-y-2 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(NOMBRE_ELECTRO) as TipoElectro[]).map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', tipo === t ? 'bg-rojo-principal text-white' : 'bg-gris-fondo text-gris-medio hover:text-gris-oscuro')}>
              {NOMBRE_ELECTRO[t]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gris-claro" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Marca o modelo…" className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-sm focus:border-rojo-principal focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {lista.map(e => (
          <button key={e.id} type="button" onClick={() => agregar(e)}
            className="group flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-left hover:border-rojo-principal">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gris-oscuro">
                {e.marca !== 'Genérico' && <span className="text-rojo-principal">{e.marca} </span>}{e.modelo}
              </p>
              <p className="text-[11px] text-gris-medio">
                {e.ancho} × {e.alto} × {e.profundidad} cm
                {e.caladoAncho ? ` · calado ${e.caladoAncho}×${e.caladoProf}` : ''}
              </p>
            </div>
            {e.verificado
              ? <span title={e.fuente ?? 'Medidas de ficha técnica'}><BadgeCheck className="h-4 w-4 text-green-600" /></span>
              : <span className="rounded bg-gris-fondo px-1.5 text-[10px] text-gris-medio" title="Medida nominal: verificar con la ficha del modelo">ref.</span>}
            <Plus className="h-4 w-4 shrink-0 text-gris-claro group-hover:text-rojo-principal" />
          </button>
        ))}
        {!lista.length && <p className="py-8 text-center text-sm text-gris-claro">No hay modelos cargados de este tipo</p>}
        <a href="/render/electrodomesticos" target="_blank" className="block pt-2 text-center text-xs font-semibold text-rojo-principal hover:underline">Administrar base de medidas →</a>
      </div>
    </>
  )
}

function AMedida() {
  const agregar = useRender(s => s.agregarGenerico)
  return (
    <div className="space-y-2 p-3 text-sm">
      <p className="text-gris-medio">Módulos sin producto asociado, para piezas a medida. Les ponés medidas, frentes y precio en el panel de la derecha.</p>
      <Boton className="w-full justify-start" onClick={() => agregar('bajo')}><Plus className="h-4 w-4" /> Bajo mesada a medida</Boton>
      <Boton className="w-full justify-start" onClick={() => agregar('alacena')}><Plus className="h-4 w-4" /> Alacena a medida</Boton>
      <Boton className="w-full justify-start" onClick={() => agregar('alto')}><Plus className="h-4 w-4" /> Columna / despensero a medida</Boton>
    </div>
  )
}

export default function PanelCatalogo() {
  const [tab, setTab] = useState<'muebles' | 'electros' | 'medida'>('muebles')
  const destino = useRender(s => s.paredDestino)
  const setDestino = useRender(s => s.setParedDestino)
  const paredes = useRender(s => s.escena.ambiente.paredes)
  const autocompletar = useRender(s => s.autocompletar)
  const opciones: { valor: Ubicacion; texto: string }[] = [
    ...(['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(p => paredes[p]).map(p => ({ valor: p as Ubicacion, texto: NOMBRE_PARED[p] })),
    { valor: 'libre', texto: NOMBRE_PARED.libre },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-gray-100 px-3 py-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-gris-oscuro">Agregar en</span>
          <Selector valor={destino} opciones={opciones} onCambio={setDestino} className="flex-1" />
        </div>
        {destino !== 'libre' && (
          <Boton className="w-full" onClick={() => autocompletar(destino as Pared)} titulo="Llena los huecos libres de la pared con bajos y alacenas del catálogo">
            <Wand2 className="h-4 w-4" /> Completar pared automáticamente
          </Boton>
        )}
      </div>
      <Pestanas
        valor={tab}
        onCambio={setTab}
        opciones={[
          { valor: 'muebles', texto: 'Muebles', icono: <Box className="h-4 w-4" /> },
          { valor: 'electros', texto: 'Electros', icono: <Sparkles className="h-4 w-4" /> },
          { valor: 'medida', texto: 'A medida', icono: <Plus className="h-4 w-4" /> },
        ]}
      />
      {tab === 'muebles' && <Muebles />}
      {tab === 'electros' && <Electros />}
      {tab === 'medida' && <AMedida />}
    </div>
  )
}
