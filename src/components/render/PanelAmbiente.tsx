'use client'
import { DoorOpen, LayoutTemplate, Plus, RectangleHorizontal, Trash2 } from 'lucide-react'
import type { Pared } from '@/lib/render/tipos'
import { NOMBRE_PARED } from '@/lib/render/tipos'
import { elevacionPorDefecto, uid } from '@/lib/render/escena'
import { useRender } from './store'
import { Boton, Fila, Interruptor, Numero, Seccion, Selector } from './ui'

const PLANTILLAS: { id: string; nombre: string; ancho: number; largo: number; paredes: Record<Pared, boolean>; ayuda: string }[] = [
  { id: 'lineal', nombre: 'Lineal', ancho: 300, largo: 220, paredes: { fondo: true, izq: false, der: false, frente: false }, ayuda: 'Todo contra una pared' },
  { id: 'l', nombre: 'En L', ancho: 340, largo: 280, paredes: { fondo: true, izq: true, der: false, frente: false }, ayuda: 'Fondo + lateral izquierdo' },
  { id: 'u', nombre: 'En U', ancho: 320, largo: 300, paredes: { fondo: true, izq: true, der: true, frente: false }, ayuda: 'Tres paredes' },
  { id: 'paralela', nombre: 'Paralela', ancho: 300, largo: 240, paredes: { fondo: true, izq: false, der: false, frente: true }, ayuda: 'Dos frentes enfrentados' },
]

export default function PanelAmbiente() {
  const amb = useRender(s => s.escena.ambiente)
  const est = useRender(s => s.escena.estandares)
  const hayItems = useRender(s => s.escena.items.length > 0)
  const mutar = useRender(s => s.mutar)
  const recentrar = useRender(s => s.recentrarCamara)
  const paredesActivas = (['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(p => amb.paredes[p])

  const aplicarPlantilla = (p: (typeof PLANTILLAS)[number]) => {
    if (hayItems && !confirm('¿Cambiar la forma del ambiente? Los muebles se mantienen, pero puede que queden fuera de lugar.')) return
    mutar(e => {
      e.ambiente.ancho = p.ancho
      e.ambiente.largo = p.largo
      e.ambiente.paredes = { ...p.paredes }
      e.ambiente.aberturas = e.ambiente.aberturas.filter(a => p.paredes[a.pared])
    })
    recentrar()
  }

  const realinearAlacenas = () => mutar(e => {
    for (const it of e.items) {
      if (it.modulo && (it.modulo.tipo === 'alacena' || it.modulo.tipo === 'esquinero-alto')) it.elevacion = elevacionPorDefecto(it.modulo, null, e.estandares)
      if (it.modulo && (it.modulo.tipo === 'bajo' || it.modulo.tipo === 'esquinero-bajo')) it.modulo.alto = e.estandares.alturaBajo
      if (it.electro && ['anafe', 'bacha', 'campana', 'microondas'].includes(it.electro.tipo)) it.elevacion = elevacionPorDefecto(null, it.electro, e.estandares)
    }
  })

  return (
    <div className="pb-6">
      <Seccion titulo="Plantillas">
        <div className="grid grid-cols-2 gap-2">
          {PLANTILLAS.map(p => (
            <button key={p.id} type="button" onClick={() => aplicarPlantilla(p)} title={p.ayuda}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-2 text-left text-sm font-semibold hover:border-rojo-principal hover:text-rojo-principal">
              <LayoutTemplate className="h-4 w-4 shrink-0" /> {p.nombre}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Medidas del ambiente">
        <Fila etiqueta="Ancho (pared del fondo)"><Numero valor={amb.ancho} min={100} max={1200} onCambio={v => mutar(e => { e.ambiente.ancho = v })} /></Fila>
        <Fila etiqueta="Largo (paredes laterales)"><Numero valor={amb.largo} min={100} max={1200} onCambio={v => mutar(e => { e.ambiente.largo = v })} /></Fila>
        <Fila etiqueta="Alto"><Numero valor={amb.alto} min={200} max={500} onCambio={v => mutar(e => { e.ambiente.alto = v })} /></Fila>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
          {(['fondo', 'izq', 'der', 'frente'] as Pared[]).map(p => (
            <Fila key={p} etiqueta={NOMBRE_PARED[p].replace('Pared ', '')}>
              <Interruptor valor={amb.paredes[p]} onCambio={v => mutar(e => { e.ambiente.paredes[p] = v })} />
            </Fila>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Puertas y ventanas" accion={
        <div className="flex gap-2">
          <button type="button" className="text-xs font-semibold text-rojo-principal" onClick={() => mutar(e => {
            e.ambiente.aberturas.push({ id: uid(), pared: paredesActivas[0] ?? 'fondo', tipo: 'ventana', s: 60, ancho: 100, alto: 100, elevacion: 110 })
          })}><Plus className="inline h-3 w-3" /> ventana</button>
          <button type="button" className="text-xs font-semibold text-rojo-principal" onClick={() => mutar(e => {
            e.ambiente.aberturas.push({ id: uid(), pared: paredesActivas[0] ?? 'fondo', tipo: 'puerta', s: 20, ancho: 80, alto: 205, elevacion: 0 })
          })}><Plus className="inline h-3 w-3" /> puerta</button>
        </div>
      }>
        {amb.aberturas.length === 0 && <p className="text-xs text-gris-claro">Sin aberturas.</p>}
        {amb.aberturas.map((a, i) => (
          <div key={a.id} className="space-y-1.5 rounded-lg border border-gray-100 p-2">
            <div className="flex items-center gap-2">
              {a.tipo === 'ventana' ? <RectangleHorizontal className="h-4 w-4 text-gris-medio" /> : <DoorOpen className="h-4 w-4 text-gris-medio" />}
              <Selector valor={a.pared} opciones={paredesActivas.map(p => ({ valor: p, texto: NOMBRE_PARED[p] }))} onCambio={v => mutar(e => { e.ambiente.aberturas[i].pared = v })} className="flex-1" />
              <button type="button" onClick={() => mutar(e => { e.ambiente.aberturas.splice(i, 1) })} className="p-1 text-gris-claro hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Fila etiqueta="Desde"><Numero valor={a.s} min={0} ancho="w-16" onCambio={v => mutar(e => { e.ambiente.aberturas[i].s = v })} /></Fila>
              <Fila etiqueta="Ancho"><Numero valor={a.ancho} min={20} ancho="w-16" onCambio={v => mutar(e => { e.ambiente.aberturas[i].ancho = v })} /></Fila>
              <Fila etiqueta="Alto"><Numero valor={a.alto} min={20} ancho="w-16" onCambio={v => mutar(e => { e.ambiente.aberturas[i].alto = v })} /></Fila>
              <Fila etiqueta="Elev."><Numero valor={a.elevacion} min={0} ancho="w-16" onCambio={v => mutar(e => { e.ambiente.aberturas[i].elevacion = v })} /></Fila>
            </div>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Estándares de la cocina">
        <Fila etiqueta="Altura bajo mesada (con zócalo)"><Numero valor={est.alturaBajo} min={60} max={100} onCambio={v => mutar(e => { e.estandares.alturaBajo = v })} /></Fila>
        <Fila etiqueta="Zócalo"><Numero valor={est.zocalo} min={0} max={20} onCambio={v => mutar(e => { e.estandares.zocalo = v })} /></Fila>
        <Fila etiqueta="Mesada continua"><Interruptor valor={est.mesadaActiva} onCambio={v => mutar(e => { e.estandares.mesadaActiva = v })} /></Fila>
        <Fila etiqueta="Espesor de mesada"><Numero valor={est.espesorMesada} min={1} max={8} paso={0.5} onCambio={v => mutar(e => { e.estandares.espesorMesada = v })} /></Fila>
        <Fila etiqueta="Profundidad de mesada"><Numero valor={est.profMesada} min={40} max={90} onCambio={v => mutar(e => { e.estandares.profMesada = v })} /></Fila>
        <Fila etiqueta="Salpicadero"><Interruptor valor={est.salpicadero} onCambio={v => mutar(e => { e.estandares.salpicadero = v })} /></Fila>
        <Fila etiqueta="Borde superior de alacenas" ayuda="Las alacenas se alinean por arriba a esta altura"><Numero valor={est.lineaAlacenas} min={150} max={300} onCambio={v => mutar(e => { e.estandares.lineaAlacenas = v })} /></Fila>
        <Boton className="w-full" onClick={realinearAlacenas}>Aplicar alturas a los muebles existentes</Boton>
      </Seccion>
    </div>
  )
}
