'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import {
  Box, Camera, ChevronLeft, ChevronRight, DoorOpen, Eye, FilePlus2, FolderOpen, Grid3x3, Lightbulb, Loader2, Magnet,
  MousePointer2, Palette, Receipt, Redo2, Ruler, Save, Settings2, Sparkles, Square, Undo2,
} from 'lucide-react'
import type { DatosProyecto, ElectroCatalogo, Escena, Presupuesto, ProductoCatalogo, TipoEnvioOpcion } from '@/lib/render/tipos'
import { formatPrice, cn } from '@/lib/utils'
import { useRender, type Panel } from './store'
import { calcularPresupuesto, descargarImagen, guardarProyecto } from './acciones'
import PanelCatalogo from './PanelCatalogo'
import PanelSeleccion from './PanelSeleccion'
import PanelAmbiente from './PanelAmbiente'
import PanelMateriales from './PanelMateriales'
import PanelLuz from './PanelLuz'
import PanelPresupuesto from './PanelPresupuesto'
import { Pestanas } from './ui'

const Escena3D = dynamic(() => import('./Escena3D'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-gris-medio"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando el editor 3D…</div>,
})

export interface ProyectoInicial {
  id: number
  datos: Escena
  presupuesto: Presupuesto
  proyecto: DatosProyecto
}

function BotonVista({ activo, onClick, titulo, children }: { activo?: boolean; onClick: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <button type="button" title={titulo} onClick={onClick}
      className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', activo ? 'bg-rojo-principal text-white' : 'text-gris-medio hover:bg-gris-fondo hover:text-gris-oscuro')}>
      {children}
    </button>
  )
}

function BarraVista() {
  const vista = useRender(s => s.vista)
  const setVista = useRender(s => s.setVista)
  const recentrar = useRender(s => s.recentrarCamara)
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-gray-100 bg-white/95 p-1 shadow-lg backdrop-blur">
      <BotonVista titulo="Perspectiva" activo={vista.camara === 'perspectiva'} onClick={() => { setVista({ camara: 'perspectiva' }); recentrar() }}><Box className="h-4 w-4" /></BotonVista>
      <BotonVista titulo="Vista de frente (desde adentro)" activo={vista.camara === 'frente'} onClick={() => { setVista({ camara: 'frente' }); recentrar() }}><Eye className="h-4 w-4" /></BotonVista>
      <BotonVista titulo="Planta" activo={vista.camara === 'planta'} onClick={() => { setVista({ camara: 'planta' }); recentrar() }}><Grid3x3 className="h-4 w-4" /></BotonVista>
      <span className="mx-1 h-6 w-px bg-gray-200" />
      <BotonVista titulo="Cotas" activo={vista.cotas} onClick={() => setVista({ cotas: !vista.cotas })}><Ruler className="h-4 w-4" /></BotonVista>
      <BotonVista titulo="Abrir puertas y cajones" activo={vista.puertasAbiertas} onClick={() => setVista({ puertasAbiertas: !vista.puertasAbiertas })}><DoorOpen className="h-4 w-4" /></BotonVista>
      <BotonVista titulo="Imanes al arrastrar" activo={vista.imanes} onClick={() => setVista({ imanes: !vista.imanes })}><Magnet className="h-4 w-4" /></BotonVista>
      <BotonVista titulo="Calidad alta (sombras más finas)" activo={vista.calidad === 'alta'} onClick={() => setVista({ calidad: vista.calidad === 'alta' ? 'normal' : 'alta' })}><Sparkles className="h-4 w-4" /></BotonVista>
      <span className="mx-1 h-6 w-px bg-gray-200" />
      <BotonVista titulo="Descargar imagen (PNG)" onClick={descargarImagen}><Camera className="h-4 w-4" /></BotonVista>
    </div>
  )
}

function Atajos() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]')) return
      const st = useRender.getState()
      const sel = st.escena.items.find(i => i.id === st.seleccion)
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) st.rehacer(); else st.deshacer(); return }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); st.rehacer(); return }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); void guardarProyecto(); return }
      if (e.key === 'Escape') { st.seleccionar(null); return }
      if (!sel) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); st.borrar(sel.id); return }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); st.duplicar(sel.id); return }
      if (e.key.toLowerCase() === 'r' && sel.ubicacion === 'libre') { st.actualizarItem(sel.id, x => { x.rot = ((x.rot ?? 0) + 90) % 360 }); return }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const paso = e.shiftKey ? 10 : 1
        st.marcarHistoria()
        if (sel.ubicacion === 'libre') {
          const dx = e.key === 'ArrowLeft' ? -paso : e.key === 'ArrowRight' ? paso : 0
          const dz = e.key === 'ArrowUp' ? -paso : e.key === 'ArrowDown' ? paso : 0
          st.moverLibre(sel.id, (sel.x ?? 0) + dx, (sel.z ?? 0) + dz)
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          st.actualizarItem(sel.id, x => { x.elevacion = Math.max(0, x.elevacion + (e.key === 'ArrowUp' ? paso : -paso)) })
        } else {
          st.moverItem(sel.id, sel.s + (e.key === 'ArrowLeft' ? -paso : paso), false)
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  // Avisar antes de salir con cambios sin guardar.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (useRender.getState().sucio) { e.preventDefault() } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])
  return null
}

function Encabezado() {
  const proyecto = useRender(s => s.proyecto)
  const setProyecto = useRender(s => s.setProyecto)
  const sucio = useRender(s => s.sucio)
  const pasado = useRender(s => s.pasado.length)
  const futuro = useRender(s => s.futuro.length)
  const deshacer = useRender(s => s.deshacer)
  const rehacer = useRender(s => s.rehacer)
  const nuevo = useRender(s => s.nuevo)
  useRender(s => s.escena.items)
  useRender(s => s.presupuesto)
  const [guardando, setGuardando] = useState(false)
  const total = calcularPresupuesto().totales.total
  const estados = { borrador: 'Borrador', presupuesto: 'Presupuesto', venta: 'Venta' }

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-3 shadow-sm">
      <Link href="/admin" className="shrink-0" title="Volver al panel">
        <Image src="/logo.png" alt="Mueble UNO" width={130} height={28} className="h-7 w-auto" priority />
      </Link>
      <span className="hidden rounded bg-rojo-suave px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rojo-principal sm:inline">Render · beta</span>
      <input
        value={proyecto.nombre}
        onChange={e => setProyecto({ nombre: e.target.value })}
        className="min-w-0 max-w-xs flex-1 rounded-md border border-transparent px-2 py-1 font-semibold text-gris-oscuro hover:border-gray-200 focus:border-rojo-principal focus:outline-none"
      />
      <span className="hidden text-xs text-gris-claro md:inline">{estados[proyecto.estado]}{sucio ? ' · sin guardar' : proyecto.id ? ' · guardado' : ''}</span>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" title="Deshacer (Ctrl+Z)" disabled={!pasado} onClick={deshacer} className="rounded-lg p-2 text-gris-medio hover:bg-gris-fondo disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
        <button type="button" title="Rehacer (Ctrl+Shift+Z)" disabled={!futuro} onClick={rehacer} className="rounded-lg p-2 text-gris-medio hover:bg-gris-fondo disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
        <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
        <span className="hidden px-2 text-right lg:block">
          <span className="block text-[10px] uppercase tracking-wide text-gris-claro">Total</span>
          <span className="block text-sm font-bold leading-none text-rojo-principal">{formatPrice(total)}</span>
        </span>
        <button type="button" title="Nuevo proyecto" onClick={() => { if (!sucio || confirm('Hay cambios sin guardar. ¿Empezar un proyecto nuevo?')) { nuevo(); window.history.replaceState(null, '', '/render') } }} className="rounded-lg p-2 text-gris-medio hover:bg-gris-fondo"><FilePlus2 className="h-4 w-4" /></button>
        <Link href="/render/proyectos" title="Proyectos guardados" className="rounded-lg p-2 text-gris-medio hover:bg-gris-fondo"><FolderOpen className="h-4 w-4" /></Link>
        <button type="button" onClick={async () => { setGuardando(true); await guardarProyecto(); setGuardando(false) }} disabled={guardando}
          className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-rojo-principal px-3 py-1.5 text-sm font-semibold text-white hover:bg-rojo-hover disabled:opacity-60">
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
        </button>
      </div>
    </header>
  )
}

function PanelDerecho() {
  const panel = useRender(s => s.panel)
  const setPanel = useRender(s => s.setPanel)
  return (
    <div className="flex h-full flex-col">
      <Pestanas<Panel>
        valor={panel}
        onCambio={setPanel}
        opciones={[
          { valor: 'seleccion', texto: 'Mueble', icono: <MousePointer2 className="h-4 w-4" /> },
          { valor: 'ambiente', texto: 'Ambiente', icono: <Square className="h-4 w-4" /> },
          { valor: 'materiales', texto: 'Materiales', icono: <Palette className="h-4 w-4" /> },
          { valor: 'luz', texto: 'Luz', icono: <Lightbulb className="h-4 w-4" /> },
          { valor: 'presupuesto', texto: 'Presupuesto', icono: <Receipt className="h-4 w-4" /> },
        ]}
      />
      <div className="flex-1 overflow-y-auto">
        {panel === 'seleccion' && <PanelSeleccion />}
        {panel === 'ambiente' && <PanelAmbiente />}
        {panel === 'materiales' && <PanelMateriales />}
        {panel === 'luz' && <PanelLuz />}
        {panel === 'presupuesto' && <PanelPresupuesto />}
      </div>
    </div>
  )
}

export default function RenderApp({ catalogo, electros, envios, inicial }: {
  catalogo: ProductoCatalogo[]; electros: ElectroCatalogo[]; envios: TipoEnvioOpcion[]; inicial: ProyectoInicial | null
}) {
  const [izq, setIzq] = useState(true)
  const [der, setDer] = useState(true)
  const aviso = useRender(s => s.aviso)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    useRender.setState({ catalogo, electros, envios })
    if (inicial) useRender.getState().cargar(inicial.datos, inicial.presupuesto, inicial.proyecto)
    else useRender.getState().nuevo()
    setListo(true)
    // En pantallas chicas arrancar con los paneles cerrados.
    if (window.innerWidth < 900) { setIzq(false); setDer(false) }
  }, [catalogo, electros, envios, inicial])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gris-fondo text-gris-oscuro">
      <Encabezado />
      <div className="relative flex min-h-0 flex-1">
        <aside className={cn('absolute inset-y-0 left-0 z-10 w-[300px] max-w-[85vw] border-r border-gray-100 bg-white transition-transform md:relative md:translate-x-0', izq ? 'translate-x-0' : '-translate-x-full md:hidden')}>
          <PanelCatalogo />
        </aside>
        <main className="relative min-w-0 flex-1">
          {listo && <Escena3D />}
          <button type="button" onClick={() => setIzq(!izq)} title="Catálogo" className="absolute left-2 top-2 z-10 flex h-8 items-center gap-1 rounded-lg bg-white/95 px-2 text-xs font-semibold text-gris-medio shadow">
            {izq ? <ChevronLeft className="h-4 w-4" /> : <><ChevronRight className="h-4 w-4" /> Catálogo</>}
          </button>
          <button type="button" onClick={() => setDer(!der)} title="Propiedades" className="absolute right-2 top-2 z-10 flex h-8 items-center gap-1 rounded-lg bg-white/95 px-2 text-xs font-semibold text-gris-medio shadow">
            {der ? <ChevronRight className="h-4 w-4" /> : <><Settings2 className="h-4 w-4" /> Propiedades <ChevronLeft className="h-4 w-4" /></>}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-2">
            <BarraVista />
          </div>
          {aviso && (
            <div className={cn('absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg', aviso.tipo === 'ok' ? 'bg-gris-oscuro text-white' : 'bg-rojo-principal text-white')}>
              {aviso.texto}
            </div>
          )}
          <Atajos />
        </main>
        <aside className={cn('absolute inset-y-0 right-0 z-10 w-[320px] max-w-[90vw] border-l border-gray-100 bg-white transition-transform md:relative md:translate-x-0', der ? 'translate-x-0' : 'translate-x-full md:hidden')}>
          <PanelDerecho />
        </aside>
      </div>
    </div>
  )
}
