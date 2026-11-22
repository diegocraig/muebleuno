'use client'
import { useEffect, useRef, useState } from 'react'
import { ImageUp, Loader2 } from 'lucide-react'
import type { EstiloTirador, GrupoMaterial, MatDef, TexturaId } from '@/lib/render/tipos'
import { NOMBRE_GRUPO } from '@/lib/render/tipos'
import { MATERIALES_PRESET, PRESETS_POR_GRUPO, TEXTURAS, preset } from '@/lib/render/materiales'
import { cn } from '@/lib/utils'
import { miniatura } from './texturas'
import { useRender } from './store'
import { Deslizador, Fila, Seccion, Selector } from './ui'

/** Muestra cuadrada del material (se genera en el navegador). */
export function Muestra({ def, activo, onClick, tam = 'h-8 w-8' }: { def: MatDef; activo?: boolean; onClick?: () => void; tam?: string }) {
  const [src, setSrc] = useState<string>('')
  useEffect(() => { setSrc(miniatura(def)) }, [def])
  return (
    <button type="button" onClick={onClick} title={def.nombre}
      className={cn('shrink-0 overflow-hidden rounded-md border bg-gris-fondo', tam, activo ? 'border-rojo-principal ring-2 ring-rojo-principal/30' : 'border-gray-200 hover:border-gris-claro')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt={def.nombre} className="h-full w-full object-cover" />}
    </button>
  )
}

export function SubirTextura({ onListo }: { onListo: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const avisar = useRender(s => s.avisar)
  const subir = async (f: File) => {
    setSubiendo(true)
    const fd = new FormData()
    fd.append('file', f)
    const r = await fetch('/api/upload?ctx=producto', { method: 'POST', body: fd })
    setSubiendo(false)
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.url) { avisar(j.error ?? 'No se pudo subir la imagen', 'error'); return }
    onListo(j.url)
  }
  return (
    <>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) subir(f); e.target.value = '' }} />
      <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1 text-xs font-semibold text-rojo-principal hover:underline">
        {subiendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageUp className="h-3 w-3" />} Usar foto propia
      </button>
    </>
  )
}

function EditorGrupo({ grupo }: { grupo: GrupoMaterial }) {
  const def = useRender(s => s.escena.materiales[grupo])
  const mutar = useRender(s => s.mutar)
  const [abierto, setAbierto] = useState(grupo === 'frentes')
  const set = (cambio: Partial<MatDef>, historia = true) => mutar(e => { e.materiales[grupo] = { ...e.materiales[grupo], ...cambio } }, historia)
  return (
    <Seccion titulo={NOMBRE_GRUPO[grupo]} accion={
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex items-center gap-2 text-xs text-gris-medio">
        <span className="max-w-[110px] truncate">{def.nombre}</span>
        <Muestra def={def} tam="h-6 w-6" />
      </button>
    }>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS_POR_GRUPO[grupo].map(id => (
          <Muestra key={id} def={MATERIALES_PRESET[id]} activo={def.nombre === MATERIALES_PRESET[id].nombre && !def.imagen} onClick={() => mutar(e => { e.materiales[grupo] = preset(id) })} />
        ))}
      </div>
      {abierto && (
        <div className="space-y-2 rounded-lg bg-gris-fondo/60 p-2">
          <Fila etiqueta="Color">
            <input type="color" value={def.color} onChange={e => set({ color: e.target.value, nombre: 'Personalizado' }, false)} onBlur={() => useRender.getState().marcarHistoria()} className="h-7 w-12 cursor-pointer rounded border border-gray-200" />
          </Fila>
          <Fila etiqueta="Textura">
            <Selector valor={def.textura} opciones={TEXTURAS.map(t => ({ valor: t.id as TexturaId, texto: t.nombre }))} onCambio={t => set({ textura: t, imagen: undefined })} />
          </Fila>
          <Fila etiqueta="Escala (m por repetición)">
            <Deslizador valor={def.escala} min={0.1} max={3} paso={0.05} onCambio={v => set({ escala: v }, false)} formato={v => `${v.toFixed(2)}`} />
          </Fila>
          <Fila etiqueta="Rugosidad">
            <Deslizador valor={def.rugosidad} min={0} max={1} onCambio={v => set({ rugosidad: v }, false)} formato={v => v.toFixed(2)} />
          </Fila>
          <Fila etiqueta="Metálico">
            <Deslizador valor={def.metalico} min={0} max={1} onCambio={v => set({ metalico: v }, false)} formato={v => v.toFixed(2)} />
          </Fila>
          <div className="flex items-center justify-between">
            <SubirTextura onListo={url => set({ imagen: url, color: '#ffffff', nombre: 'Foto propia' })} />
            {def.imagen && <button type="button" className="text-xs text-gris-medio hover:underline" onClick={() => set({ imagen: undefined })}>Quitar foto</button>}
          </div>
        </div>
      )}
      {!abierto && <button type="button" onClick={() => setAbierto(true)} className="text-xs font-semibold text-gris-medio hover:text-rojo-principal">Ajustar color, textura y brillo…</button>}
    </Seccion>
  )
}

const TIRADORES: { valor: EstiloTirador; texto: string }[] = [
  { valor: 'barra', texto: 'Barral' },
  { valor: 'boton', texto: 'Botón' },
  { valor: 'perfil', texto: 'Perfil de aluminio' },
  { valor: 'gola', texto: 'Gola (sin tirador)' },
  { valor: 'push', texto: 'Push (sin tirador)' },
]

export default function PanelMateriales() {
  const tir = useRender(s => s.escena.tirador)
  const mutar = useRender(s => s.mutar)
  return (
    <div className="pb-6">
      <Seccion titulo="Tiradores">
        <Fila etiqueta="Estilo">
          <Selector valor={tir.estilo} opciones={TIRADORES} onCambio={v => mutar(e => { e.tirador.estilo = v })} />
        </Fila>
        <Fila etiqueta="Color">
          <div className="flex gap-1">
            {[['#b9bcc0', 0.9, 'Aluminio'], ['#1e1e1e', 0.4, 'Negro'], ['#b08d57', 0.9, 'Dorado'], ['#f2f2f2', 0.1, 'Blanco']].map(([c, m, n]) => (
              <button key={c as string} type="button" title={n as string} onClick={() => mutar(e => { e.tirador.color = c as string; e.tirador.metalico = m as number })}
                className={cn('h-6 w-6 rounded-full border-2', tir.color === c ? 'border-rojo-principal' : 'border-gray-200')} style={{ background: c as string }} />
            ))}
          </div>
        </Fila>
      </Seccion>
      {(Object.keys(NOMBRE_GRUPO) as GrupoMaterial[]).map(g => <EditorGrupo key={g} grupo={g} />)}
    </div>
  )
}
