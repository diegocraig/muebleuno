'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Controles chicos con la estética del panel de muebleuno (grises + rojo).

export function Seccion({ titulo, children, accion }: { titulo: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <section className="border-b border-gray-100 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gris-medio">{titulo}</h3>
        {accion}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function Fila({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gris-medio" title={ayuda}>{etiqueta}</span>
      <div className="flex items-center gap-1">{children}</div>
    </label>
  )
}

/** Input numérico que confirma al salir o con Enter (no en cada tecla). */
export function Numero({ valor, onCambio, min, max, paso = 1, sufijo = 'cm', ancho = 'w-20', deshabilitado }: {
  valor: number; onCambio: (v: number) => void; min?: number; max?: number; paso?: number; sufijo?: string; ancho?: string; deshabilitado?: boolean
}) {
  const [txt, setTxt] = useState(String(valor))
  useEffect(() => { setTxt(String(Math.round(valor * 100) / 100)) }, [valor])
  const confirmar = () => {
    const n = parseFloat(txt.replace(',', '.'))
    if (!isFinite(n)) { setTxt(String(valor)); return }
    const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
    if (v !== valor) onCambio(v)
    setTxt(String(v))
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        inputMode="decimal"
        step={paso}
        disabled={deshabilitado}
        className={cn('rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm focus:border-rojo-principal focus:outline-none disabled:bg-gray-50 disabled:text-gris-claro', ancho)}
        value={txt}
        onChange={e => setTxt(e.target.value)}
        onBlur={confirmar}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
      {sufijo && <span className="w-6 text-xs text-gris-claro">{sufijo}</span>}
    </span>
  )
}

export function Deslizador({ valor, onCambio, min, max, paso = 0.01, formato }: {
  valor: number; onCambio: (v: number) => void; min: number; max: number; paso?: number; formato?: (v: number) => string
}) {
  return (
    <span className="flex items-center gap-2">
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={e => onCambio(parseFloat(e.target.value))} className="w-28 accent-rojo-principal" />
      <span className="w-12 text-right text-xs tabular-nums text-gris-medio">{formato ? formato(valor) : valor}</span>
    </span>
  )
}

export function Selector<T extends string>({ valor, opciones, onCambio, className }: { valor: T; opciones: { valor: T; texto: string }[]; onCambio: (v: T) => void; className?: string }) {
  return (
    <select
      value={valor}
      onChange={e => onCambio(e.target.value as T)}
      className={cn('rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-rojo-principal focus:outline-none', className)}
    >
      {opciones.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
    </select>
  )
}

export function Interruptor({ valor, onCambio }: { valor: boolean; onCambio: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      onClick={() => onCambio(!valor)}
      className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', valor ? 'bg-rojo-principal' : 'bg-gray-300')}
    >
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', valor ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

export function Boton({ children, onClick, variante = 'secundario', className, deshabilitado, titulo, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro'; className?: string; deshabilitado?: boolean; titulo?: string; type?: 'button' | 'submit'
}) {
  const estilos = {
    primario: 'bg-rojo-principal text-white hover:bg-rojo-hover',
    secundario: 'border border-gray-200 bg-white text-gris-oscuro hover:border-rojo-principal hover:text-rojo-principal',
    fantasma: 'text-gris-medio hover:bg-gris-fondo hover:text-gris-oscuro',
    peligro: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }
  return (
    <button
      type={type}
      title={titulo}
      disabled={deshabilitado}
      onClick={onClick}
      className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40', estilos[variante], className)}
    >
      {children}
    </button>
  )
}

export function Pestanas<T extends string>({ valor, opciones, onCambio }: { valor: T; opciones: { valor: T; texto: string; icono?: React.ReactNode }[]; onCambio: (v: T) => void }) {
  return (
    <div className="flex border-b border-gray-100">
      {opciones.map(o => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onCambio(o.valor)}
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 border-b-2 px-1 py-2 text-[11px] font-semibold transition-colors',
            valor === o.valor ? 'border-rojo-principal text-rojo-principal' : 'border-transparent text-gris-medio hover:text-gris-oscuro',
          )}
        >
          {o.icono}
          {o.texto}
        </button>
      ))}
    </div>
  )
}
