'use client'
import { Moon, Sun, Sunrise, Lamp } from 'lucide-react'
import type { Luces } from '@/lib/render/tipos'
import { kelvinAHex } from '@/lib/render/materiales'
import { cn } from '@/lib/utils'
import { useRender } from './store'
import { Boton, Color, Deslizador, Fila, Interruptor, Seccion, Selector } from './ui'

type Preset = { id: string; nombre: string; icono: React.ReactNode; luces: Partial<Omit<Luces, 'sol' | 'techo' | 'led'>> & { sol?: Partial<Luces['sol']>; techo?: Partial<Luces['techo']>; led?: Partial<Luces['led']> } }

const PRESETS: Preset[] = [
  { id: 'dia', nombre: 'Día', icono: <Sun className="h-4 w-4" />, luces: { exposicion: 0.85, ambiente: 0.3, entorno: 0.4, fondo: '#e9e7e3', sol: { activo: true, elevacion: 40, intensidad: 2.4, temperatura: 5800 }, techo: { activo: false }, led: { activo: false } } },
  { id: 'tarde', nombre: 'Atardecer', icono: <Sunrise className="h-4 w-4" />, luces: { exposicion: 1.05, ambiente: 0.3, entorno: 0.4, fondo: '#e7dccd', sol: { activo: true, elevacion: 12, intensidad: 2.8, temperatura: 3200 }, techo: { activo: true, intensidad: 4, temperatura: 3000 }, led: { activo: true, intensidad: 3, temperatura: 3000 } } },
  { id: 'noche', nombre: 'Noche', icono: <Moon className="h-4 w-4" />, luces: { exposicion: 1.1, ambiente: 0.08, entorno: 0.15, fondo: '#2a2d33', sol: { activo: false }, techo: { activo: true, intensidad: 7, temperatura: 3000 }, led: { activo: true, intensidad: 5, temperatura: 2900 } } },
  { id: 'estudio', nombre: 'Estudio', icono: <Lamp className="h-4 w-4" />, luces: { exposicion: 0.9, ambiente: 0.6, entorno: 0.7, fondo: '#f4f4f4', sol: { activo: true, elevacion: 60, intensidad: 1.2, temperatura: 6500 }, techo: { activo: true, intensidad: 4, temperatura: 5000, tipo: 'panel' }, led: { activo: false } } },
]

function Temperatura({ valor, onCambio }: { valor: number; onCambio: (v: number) => void }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-4 w-4 rounded-full border border-gray-200" style={{ background: kelvinAHex(valor) }} />
      <Deslizador valor={valor} min={2200} max={7500} paso={100} onCambio={onCambio} formato={v => `${v}K`} />
    </span>
  )
}

export default function PanelLuz() {
  const l = useRender(s => s.escena.luces)
  const aberturas = useRender(s => s.escena.ambiente.aberturas)
  const mutar = useRender(s => s.mutar)
  const set = (fn: (l: Luces) => void, historia = false) => mutar(e => fn(e.luces), historia)

  const aplicar = (p: Preset) => mutar(e => {
    const { sol, techo, led, ...resto } = p.luces
    Object.assign(e.luces, resto, { preset: p.id })
    if (sol) Object.assign(e.luces.sol, sol)
    if (techo) Object.assign(e.luces.techo, techo)
    if (led) Object.assign(e.luces.led, led)
  })

  // Apunta el sol para que entre por la primera ventana.
  const solPorVentana = () => {
    const v = aberturas.find(a => a.tipo === 'ventana')
    if (!v) return
    const az = { fondo: 0, der: 90, frente: 180, izq: 270 }[v.pared]
    set(x => { x.sol.activo = true; x.sol.azimut = az; x.sol.elevacion = Math.min(x.sol.elevacion, 30) }, true)
  }

  return (
    <div className="pb-6">
      <Seccion titulo="Ambientes de luz">
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.id} type="button" onClick={() => aplicar(p)}
              className={cn('flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-semibold', l.preset === p.id ? 'border-rojo-principal text-rojo-principal' : 'border-gray-200 text-gris-medio hover:border-gris-claro')}>
              {p.icono}{p.nombre}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="General">
        <Fila etiqueta="Exposición"><Deslizador valor={l.exposicion} min={0.3} max={2.5} onCambio={v => set(x => { x.exposicion = v })} formato={v => v.toFixed(2)} /></Fila>
        <Fila etiqueta="Luz ambiente"><Deslizador valor={l.ambiente} min={0} max={2} onCambio={v => set(x => { x.ambiente = v })} formato={v => v.toFixed(2)} /></Fila>
        <Fila etiqueta="Reflejos"><Deslizador valor={l.entorno} min={0} max={2} onCambio={v => set(x => { x.entorno = v })} formato={v => v.toFixed(2)} /></Fila>
        <Fila etiqueta="Sombras"><Interruptor valor={l.sombras} onCambio={v => set(x => { x.sombras = v }, true)} /></Fila>
        <Fila etiqueta="Fondo">
          <Color valor={l.fondo} onCambio={v => set(x => { x.fondo = v })} />
        </Fila>
      </Seccion>

      <Seccion titulo="Sol" accion={<Interruptor valor={l.sol.activo} onCambio={v => set(x => { x.sol.activo = v }, true)} />}>
        <Fila etiqueta="Dirección"><Deslizador valor={l.sol.azimut} min={0} max={360} paso={1} onCambio={v => set(x => { x.sol.azimut = v })} formato={v => `${v}°`} /></Fila>
        <Fila etiqueta="Altura"><Deslizador valor={l.sol.elevacion} min={3} max={85} paso={1} onCambio={v => set(x => { x.sol.elevacion = v })} formato={v => `${v}°`} /></Fila>
        <Fila etiqueta="Intensidad"><Deslizador valor={l.sol.intensidad} min={0} max={6} onCambio={v => set(x => { x.sol.intensidad = v })} formato={v => v.toFixed(1)} /></Fila>
        <Fila etiqueta="Color"><Temperatura valor={l.sol.temperatura} onCambio={v => set(x => { x.sol.temperatura = v })} /></Fila>
        {aberturas.some(a => a.tipo === 'ventana') && <Boton className="w-full" onClick={solPorVentana}>Que entre por la ventana</Boton>}
      </Seccion>

      <Seccion titulo="Luces de techo" accion={<Interruptor valor={l.techo.activo} onCambio={v => set(x => { x.techo.activo = v }, true)} />}>
        <Fila etiqueta="Tipo">
          <Selector valor={l.techo.tipo} opciones={[{ valor: 'spot', texto: 'Spots dicroicos' }, { valor: 'panel', texto: 'Paneles LED' }]} onCambio={v => set(x => { x.techo.tipo = v }, true)} />
        </Fila>
        <Fila etiqueta="Filas × columnas">
          <span className="flex items-center gap-1">
            <Selector valor={String(l.techo.filas)} opciones={[1, 2, 3, 4].map(n => ({ valor: String(n), texto: String(n) }))} onCambio={v => set(x => { x.techo.filas = Number(v) }, true)} />
            ×
            <Selector valor={String(l.techo.columnas)} opciones={[1, 2, 3, 4].map(n => ({ valor: String(n), texto: String(n) }))} onCambio={v => set(x => { x.techo.columnas = Number(v) }, true)} />
          </span>
        </Fila>
        <Fila etiqueta="Intensidad"><Deslizador valor={l.techo.intensidad} min={0} max={15} paso={0.1} onCambio={v => set(x => { x.techo.intensidad = v })} formato={v => v.toFixed(1)} /></Fila>
        <Fila etiqueta="Color"><Temperatura valor={l.techo.temperatura} onCambio={v => set(x => { x.techo.temperatura = v })} /></Fila>
      </Seccion>

      <Seccion titulo="LED bajo alacenas" accion={<Interruptor valor={l.led.activo} onCambio={v => set(x => { x.led.activo = v }, true)} />}>
        <Fila etiqueta="Intensidad"><Deslizador valor={l.led.intensidad} min={0} max={12} paso={0.1} onCambio={v => set(x => { x.led.intensidad = v })} formato={v => v.toFixed(1)} /></Fila>
        <Fila etiqueta="Color"><Temperatura valor={l.led.temperatura} onCambio={v => set(x => { x.led.temperatura = v })} /></Fila>
      </Seccion>
    </div>
  )
}
