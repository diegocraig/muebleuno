'use client'
import { useMemo } from 'react'
import { AlertTriangle, Copy, ExternalLink, Lock, Plus, RotateCw, Save, Trash2, Undo2, Unlock, X } from 'lucide-react'
import type { Columna, MatDef, TipoColumna, Ubicacion } from '@/lib/render/tipos'
import { NOMBRE_ELECTRO, NOMBRE_PARED } from '@/lib/render/tipos'
import { conflictos, largoPared } from '@/lib/render/escena'
import { MATERIALES_PRESET, PRESETS_POR_GRUPO, preset } from '@/lib/render/materiales'
import { formatPrice, cn } from '@/lib/utils'
import { useRender, useSeleccionado } from './store'
import { Boton, Fila, Interruptor, Numero, Seccion, Selector } from './ui'
import { Muestra } from './PanelMateriales'

const TIPOS_COL: { valor: TipoColumna; texto: string }[] = [
  { valor: 'puerta', texto: 'Puerta' },
  { valor: 'vidrio', texto: 'Puerta vidriada' },
  { valor: 'cajones', texto: 'Cajonera' },
  { valor: 'rebatible', texto: 'Rebatible' },
  { valor: 'micro', texto: 'Hueco microondas' },
  { valor: 'hueco', texto: 'Estante abierto' },
  { valor: 'bandejero', texto: 'Bandejero' },
  { valor: 'ciego', texto: 'Panel ciego' },
]

function SelectorMaterial({ titulo, valor, opciones, onCambio }: { titulo: string; valor?: MatDef; opciones: string[]; onCambio: (m?: MatDef) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-gris-medio">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onCambio(undefined)} title="Usar el del ambiente"
          className={cn('flex h-8 w-8 items-center justify-center rounded-md border text-[9px] font-bold text-gris-medio', !valor ? 'border-rojo-principal ring-2 ring-rojo-principal/30' : 'border-gray-200')}>
          AMB
        </button>
        {opciones.map(id => (
          <Muestra key={id} def={MATERIALES_PRESET[id]} activo={valor?.nombre === MATERIALES_PRESET[id].nombre} onClick={() => onCambio(preset(id))} />
        ))}
      </div>
    </div>
  )
}

export default function PanelSeleccion() {
  const it = useSeleccionado()
  const esc = useRender(s => s.escena)
  const catalogo = useRender(s => s.catalogo)
  const actualizar = useRender(s => s.actualizarItem)
  const moverItem = useRender(s => s.moverItem)
  const cambiarUbicacion = useRender(s => s.cambiarUbicacion)
  const duplicar = useRender(s => s.duplicar)
  const borrar = useRender(s => s.borrar)
  const avisar = useRender(s => s.avisar)
  const setCatalogo = useRender(s => s.setCatalogo)
  const lista = useMemo(() => conflictos(esc), [esc])

  if (!it) {
    return (
      <div className="p-4 text-sm text-gris-medio">
        <p className="mb-3">Hacé clic en un mueble o electrodoméstico para editarlo. Arrastralo para moverlo a lo largo de su pared (se imanta a los vecinos; mantené <kbd className="rounded bg-gris-fondo px-1">Alt</kbd> para moverlo libre).</p>
        <ul className="space-y-1 text-xs">
          <li><kbd className="rounded bg-gris-fondo px-1">Supr</kbd> borrar · <kbd className="rounded bg-gris-fondo px-1">Ctrl+D</kbd> duplicar</li>
          <li><kbd className="rounded bg-gris-fondo px-1">←</kbd><kbd className="rounded bg-gris-fondo px-1">→</kbd> mover 1 cm (con Shift, 10 cm)</li>
          <li><kbd className="rounded bg-gris-fondo px-1">Ctrl+Z</kbd> deshacer · <kbd className="rounded bg-gris-fondo px-1">Ctrl+Shift+Z</kbd> rehacer</li>
          <li><kbd className="rounded bg-gris-fondo px-1">R</kbd> rotar (islas) · <kbd className="rounded bg-gris-fondo px-1">Esc</kbd> deseleccionar</li>
        </ul>
        {lista.length > 0 && <Conflictos lista={lista} />}
      </div>
    )
  }

  const producto = it.productoId ? catalogo.find(p => p.id === it.productoId) : undefined
  const mod = it.modulo
  const L = it.ubicacion === 'libre' ? 0 : largoPared(esc, it.ubicacion)
  const ancho = mod?.ancho ?? it.electro!.ancho
  const ubicaciones: { valor: Ubicacion; texto: string }[] = (['fondo', 'izq', 'der', 'frente'] as const)
    .filter(p => esc.ambiente.paredes[p]).map(p => ({ valor: p, texto: NOMBRE_PARED[p] }))
  ubicaciones.push({ valor: 'libre', texto: NOMBRE_PARED.libre })

  const setCol = (i: number, c: Partial<Columna>) => actualizar(it.id, x => { x.modulo!.columnas[i] = { ...x.modulo!.columnas[i], ...c } })

  const guardarComoProducto = async () => {
    if (!mod || !it.productoId) return
    const r = await fetch(`/api/render/modulos/${it.productoId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: mod.tipo, ancho: mod.ancho, alto: mod.alto, profundidad: mod.profundidad, columnas: mod.columnas }),
    })
    if (!r.ok) { avisar('No se pudo guardar el ajuste', 'error'); return }
    setCatalogo(catalogo.map(p => p.id === it.productoId ? { ...p, def: { ...p.def!, ...mod }, ajustado: true } : p))
    avisar('Medidas guardadas para este producto en todos los proyectos')
  }
  const restaurarProducto = async () => {
    if (!it.productoId) return
    await fetch(`/api/render/modulos/${it.productoId}`, { method: 'DELETE' })
    avisar('Ajuste borrado: recargá la página para ver las medidas deducidas del nombre')
  }

  return (
    <div className="pb-6">
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rojo-principal">
            {it.origen === 'producto' ? 'Producto del catálogo' : it.origen === 'electro' ? NOMBRE_ELECTRO[it.electro!.tipo] : 'Módulo a medida'}
          </p>
          {it.origen === 'producto'
            ? <h2 className="font-bold leading-tight text-gris-oscuro">{it.nombre}</h2>
            : <input value={it.nombre} onChange={e => actualizar(it.id, x => { x.nombre = e.target.value })} className="w-full rounded border border-transparent font-bold text-gris-oscuro hover:border-gray-200 focus:border-rojo-principal focus:outline-none" />}
          {producto && (
            <a href={`/productos/${producto.slug}`} target="_blank" className="mt-0.5 inline-flex items-center gap-1 text-xs text-gris-medio hover:text-rojo-principal">
              {formatPrice(producto.precio)} · ver ficha <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <button type="button" onClick={() => useRender.getState().seleccionar(null)} className="rounded p-1 text-gris-claro hover:bg-gris-fondo"><X className="h-4 w-4" /></button>
      </div>

      <Seccion titulo="Ubicación">
        <Fila etiqueta="Pared">
          <Selector valor={it.ubicacion} opciones={ubicaciones} onCambio={u => cambiarUbicacion(it.id, u)} />
        </Fila>
        {it.ubicacion !== 'libre' ? (
          <Fila etiqueta="Desde el inicio" ayuda="Distancia desde la esquina izquierda de la pared (fondo/frente) o desde la esquina del fondo (laterales)">
            <Numero valor={it.s} min={0} max={L - ancho} onCambio={v => { useRender.getState().marcarHistoria(); moverItem(it.id, v, false) }} />
          </Fila>
        ) : (
          <>
            <Fila etiqueta="X (centro)"><Numero valor={it.x ?? 0} onCambio={v => actualizar(it.id, x => { x.x = v })} /></Fila>
            <Fila etiqueta="Z (centro)"><Numero valor={it.z ?? 0} onCambio={v => actualizar(it.id, x => { x.z = v })} /></Fila>
            <Fila etiqueta="Rotación">
              <Boton variante="secundario" onClick={() => actualizar(it.id, x => { x.rot = ((x.rot ?? 0) + 90) % 360 })}><RotateCw className="h-4 w-4" /> {it.rot ?? 0}°</Boton>
            </Fila>
          </>
        )}
        <Fila etiqueta="Altura desde el piso"><Numero valor={it.elevacion} min={0} max={esc.ambiente.alto} onCambio={v => actualizar(it.id, x => { x.elevacion = v })} /></Fila>
        {mod?.tipo.startsWith('esquinero') && (
          <Fila etiqueta="Brazo hacia">
            <Selector valor={it.esquina ?? 'izq'} opciones={[{ valor: 'izq', texto: 'Izquierda' }, { valor: 'der', texto: 'Derecha' }]} onCambio={v => actualizar(it.id, x => { x.esquina = v })} />
          </Fila>
        )}
      </Seccion>

      <Seccion titulo="Medidas">
        {mod ? (
          <>
            <Fila etiqueta="Ancho"><Numero valor={mod.ancho} min={10} max={400} onCambio={v => actualizar(it.id, x => { x.modulo!.ancho = v })} /></Fila>
            <Fila etiqueta="Alto"><Numero valor={mod.alto} min={10} max={300} onCambio={v => actualizar(it.id, x => { x.modulo!.alto = v })} /></Fila>
            <Fila etiqueta="Profundidad"><Numero valor={mod.profundidad} min={10} max={120} onCambio={v => actualizar(it.id, x => { x.modulo!.profundidad = v })} /></Fila>
          </>
        ) : (
          <>
            <Fila etiqueta="Ancho"><Numero valor={it.electro!.ancho} min={10} max={200} onCambio={v => actualizar(it.id, x => { x.electro!.ancho = v })} /></Fila>
            <Fila etiqueta="Alto"><Numero valor={it.electro!.alto} min={1} max={250} onCambio={v => actualizar(it.id, x => { x.electro!.alto = v })} /></Fila>
            <Fila etiqueta="Profundidad"><Numero valor={it.electro!.profundidad} min={10} max={100} onCambio={v => actualizar(it.id, x => { x.electro!.profundidad = v })} /></Fila>
            <Fila etiqueta="Acabado">
              <Selector valor={it.electro!.acabado} opciones={[{ valor: 'inox', texto: 'Acero inox' }, { valor: 'blanco', texto: 'Blanco' }, { valor: 'negro', texto: 'Negro' }, { valor: 'gris', texto: 'Gris' }]} onCambio={v => actualizar(it.id, x => { x.electro!.acabado = v })} />
            </Fila>
            <Fila etiqueta="Empotrable / integrable"><Interruptor valor={it.electro!.empotrable} onCambio={v => actualizar(it.id, x => { x.electro!.empotrable = v })} /></Fila>
          </>
        )}
      </Seccion>

      {mod && (
        <Seccion titulo="Frentes" accion={
          <button type="button" className="text-xs font-semibold text-rojo-principal" onClick={() => actualizar(it.id, x => { x.modulo!.columnas.push({ tipo: 'puerta' }) })}>
            <Plus className="inline h-3 w-3" /> columna
          </button>
        }>
          {mod.columnas.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <Selector valor={c.tipo} opciones={TIPOS_COL} onCambio={t => setCol(i, { tipo: t, ...(t === 'cajones' && !c.cajones ? { cajones: 3 } : {}) })} className="flex-1" />
              {c.tipo === 'cajones' && <Numero valor={c.cajones ?? 3} min={1} max={6} sufijo="" ancho="w-12" onCambio={v => setCol(i, { cajones: v })} />}
              <input
                placeholder="auto"
                value={c.ancho ?? ''}
                onChange={e => setCol(i, { ancho: e.target.value ? Number(e.target.value) : undefined })}
                className="w-14 rounded-md border border-gray-200 px-1.5 py-1 text-right text-sm focus:border-rojo-principal focus:outline-none"
                title="Ancho de la columna en cm (vacío = reparte)"
              />
              <button type="button" disabled={mod.columnas.length <= 1} onClick={() => actualizar(it.id, x => { x.modulo!.columnas.splice(i, 1) })} className="p-1 text-gris-claro hover:text-red-600 disabled:opacity-30"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <Fila etiqueta="Bisagras invertidas"><Interruptor valor={!!it.espejado} onCambio={v => actualizar(it.id, x => { x.espejado = v })} /></Fila>
        </Seccion>
      )}

      {mod && (
        <Seccion titulo="Colores de este mueble">
          <SelectorMaterial titulo="Frente" valor={it.frente} opciones={PRESETS_POR_GRUPO.frentes} onCambio={m => actualizar(it.id, x => { x.frente = m })} />
          <SelectorMaterial titulo="Cuerpo" valor={it.cuerpo} opciones={PRESETS_POR_GRUPO.cuerpos} onCambio={m => actualizar(it.id, x => { x.cuerpo = m })} />
        </Seccion>
      )}

      <Seccion titulo="Presupuesto">
        <Fila etiqueta="Cuenta en el presupuesto"><Interruptor valor={it.cuentaEnPresupuesto} onCambio={v => actualizar(it.id, x => { x.cuentaEnPresupuesto = v })} /></Fila>
        {it.origen !== 'producto' && (
          <Fila etiqueta="Precio unitario"><Numero valor={it.precio} min={0} sufijo="$" ancho="w-28" onCambio={v => actualizar(it.id, x => { x.precio = v })} /></Fila>
        )}
        {it.grupo && <p className="text-xs text-gris-medio">Es parte de un combo: se mueve y se borra junto con sus otras piezas.</p>}
      </Seccion>

      <div className="flex flex-wrap gap-2 px-4 pt-3">
        <Boton onClick={() => duplicar(it.id)}><Copy className="h-4 w-4" /> Duplicar</Boton>
        <Boton onClick={() => actualizar(it.id, x => { x.bloqueado = !x.bloqueado })}>{it.bloqueado ? <><Unlock className="h-4 w-4" /> Desbloquear</> : <><Lock className="h-4 w-4" /> Bloquear</>}</Boton>
        <Boton variante="peligro" onClick={() => borrar(it.id)}><Trash2 className="h-4 w-4" /> Borrar</Boton>
      </div>
      {it.origen === 'producto' && mod && (
        <div className="mt-3 space-y-1 border-t border-gray-100 px-4 pt-3">
          <p className="text-xs text-gris-medio">Los cambios de medidas y frentes valen solo para este proyecto. Si el producto real es así, guardalo para todos:</p>
          <div className="flex flex-wrap gap-2">
            <Boton onClick={guardarComoProducto}><Save className="h-4 w-4" /> Guardar en el producto</Boton>
            {producto?.ajustado && <Boton variante="fantasma" onClick={restaurarProducto}><Undo2 className="h-4 w-4" /> Volver a lo deducido</Boton>}
          </div>
        </div>
      )}
      {lista.length > 0 && <div className="px-4"><Conflictos lista={lista} /></div>}
    </div>
  )
}

function Conflictos({ lista }: { lista: { a: string; texto: string }[] }) {
  const seleccionar = useRender(s => s.seleccionar)
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="mb-1 flex items-center gap-1 text-xs font-bold text-amber-800"><AlertTriangle className="h-4 w-4" /> {lista.length} {lista.length === 1 ? 'problema' : 'problemas'} de medidas</p>
      <ul className="space-y-0.5 text-xs text-amber-900">
        {lista.slice(0, 8).map((c, i) => (
          <li key={i}><button type="button" className="text-left hover:underline" onClick={() => seleccionar(c.a)}>{c.texto}</button></li>
        ))}
      </ul>
    </div>
  )
}
