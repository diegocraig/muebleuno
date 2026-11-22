'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Columna, EstiloTirador, Item, MatDef } from '@/lib/render/tipos'
import { cajaUV, M } from './geometria'
import { MAT, material, matColor } from './texturas'
import { useRender } from './store'

// Mueble paramétrico. Origen local: centro de la planta, a la altura de la
// base del mueble; el frente mira hacia +z. Medidas internas en metros.

const T = 0.018      // espesor de placa
const LUZ = 0.003    // luz entre frentes
const GOLA = 0.035

interface Ctx {
  frente: THREE.Material
  cuerpo: THREE.Material
  zocalo: THREE.Material
  tirador: { estilo: EstiloTirador; mat: THREE.Material }
  tipo: Item['modulo'] extends infer D ? D extends { tipo: infer X } ? X : never : never
  elev: number
}

function Pieza({ w, h, d, p, mat, sombra = true }: { w: number; h: number; d: number; p: [number, number, number]; mat: THREE.Material; sombra?: boolean }) {
  return <mesh geometry={cajaUV(w, h, d)} material={mat} position={p} castShadow={sombra} receiveShadow />
}

// ─── Tiradores ──────────────────────────────────────────────────────────────

function Tirador({ x, y, z, vertical, largo, estilo, mat }: { x: number; y: number; z: number; vertical: boolean; largo: number; estilo: EstiloTirador; mat: THREE.Material }) {
  if (estilo === 'push' || estilo === 'gola' || estilo === 'perfil') return null
  if (estilo === 'boton') {
    return (
      <mesh position={[x, y, z + 0.014]} material={mat} castShadow>
        <sphereGeometry args={[0.012, 16, 12]} />
      </mesh>
    )
  }
  const l = Math.min(0.16, largo)
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, 0.026]} material={mat} castShadow>
        <boxGeometry args={vertical ? [0.011, l, 0.011] : [l, 0.011, 0.011]} />
      </mesh>
      {[-1, 1].map(k => (
        <mesh key={k} position={vertical ? [0, k * (l / 2 - 0.012), 0.012] : [k * (l / 2 - 0.012), 0, 0.012]} material={mat}>
          <cylinderGeometry args={[0.004, 0.004, 0.024, 8]} />
        </mesh>
      ))}
    </group>
  )
}

/** Perfil de aluminio sobre el canto del frente (estilo "perfil"). */
function Perfil({ x, y, w, mat }: { x: number; y: number; w: number; mat: THREE.Material }) {
  return <mesh position={[x, y, T / 2 + 0.006]} material={mat} castShadow geometry={cajaUV(w, 0.02, 0.012)} />
}

// ─── Hojas animadas ─────────────────────────────────────────────────────────

function useApertura() {
  const abierta = useRender(s => s.vista.puertasAbiertas)
  const v = useRef(0)
  return { abierta, v }
}

/** Puerta con bisagra a un costado (o arriba si es rebatible). Coordenadas: rectángulo [x0,x1]×[y0,y1] en el plano del frente. */
function Hoja({ x0, x1, y0, y1, bisagra, ctx, vidrio = false, tiradorEn, sinTirador = false }: {
  x0: number; x1: number; y0: number; y1: number; bisagra: 'izq' | 'der' | 'arriba'
  ctx: Ctx; vidrio?: boolean; tiradorEn: 'arriba' | 'abajo' | 'medio'; sinTirador?: boolean
}) {
  const grupo = useRef<THREE.Group>(null)
  const { abierta, v } = useApertura()
  useFrame((_, dt) => {
    const obj = abierta ? 1 : 0
    if (Math.abs(v.current - obj) < 0.001) return
    v.current += (obj - v.current) * Math.min(1, dt * 6)
    if (!grupo.current) return
    if (bisagra === 'arriba') grupo.current.rotation.x = -v.current * 1.35
    else grupo.current.rotation.y = (bisagra === 'izq' ? -1 : 1) * v.current * 1.75
  })
  const w = x1 - x0 - LUZ, h = y1 - y0 - LUZ
  // El grupo pivota en la bisagra; la hoja se dibuja desplazada desde ahí.
  const pivote: [number, number, number] = bisagra === 'izq' ? [x0 + LUZ / 2, (y0 + y1) / 2, 0] : bisagra === 'der' ? [x1 - LUZ / 2, (y0 + y1) / 2, 0] : [(x0 + x1) / 2, y1 - LUZ / 2, 0]
  const centro: [number, number, number] = bisagra === 'izq' ? [w / 2, 0, T / 2] : bisagra === 'der' ? [-w / 2, 0, T / 2] : [0, -h / 2, T / 2]
  const { estilo, mat } = ctx.tirador
  const tx = bisagra === 'izq' ? centro[0] + w / 2 - 0.035 : bisagra === 'der' ? centro[0] - w / 2 + 0.035 : 0
  const ty = tiradorEn === 'arriba' ? centro[1] + h / 2 - 0.1 : tiradorEn === 'abajo' ? centro[1] - h / 2 + 0.1 : centro[1]
  const vertical = bisagra !== 'arriba'
  return (
    <group position={pivote}>
      <group ref={grupo}>
        {vidrio ? (
          <group position={centro}>
            {/* marco de aluminio + vidrio */}
            <Pieza w={w} h={0.045} d={T} p={[0, h / 2 - 0.0225, 0]} mat={ctx.tirador.mat} />
            <Pieza w={w} h={0.045} d={T} p={[0, -h / 2 + 0.0225, 0]} mat={ctx.tirador.mat} />
            <Pieza w={0.045} h={h - 0.09} d={T} p={[-w / 2 + 0.0225, 0, 0]} mat={ctx.tirador.mat} />
            <Pieza w={0.045} h={h - 0.09} d={T} p={[w / 2 - 0.0225, 0, 0]} mat={ctx.tirador.mat} />
            <mesh position={[0, 0, 0]} material={MAT.vidrio} geometry={cajaUV(w - 0.09, h - 0.09, 0.004)} />
          </group>
        ) : (
          <Pieza w={w} h={h} d={T} p={centro} mat={ctx.frente} />
        )}
        {!sinTirador && estilo === 'perfil' && (
          <Perfil x={centro[0]} y={tiradorEn === 'abajo' ? centro[1] - h / 2 + 0.01 : centro[1] + h / 2 - 0.01} w={w} mat={mat} />
        )}
        {!sinTirador && (
          <Tirador x={tx} y={ty} z={centro[2] + T / 2 - 0.009} vertical={vertical} largo={Math.min(w, h) * 0.6} estilo={estilo} mat={mat} />
        )}
      </group>
    </group>
  )
}

/** Cajón que sale hacia adelante al "abrir". */
function Cajon({ x0, x1, y0, y1, prof, ctx, indice }: { x0: number; x1: number; y0: number; y1: number; prof: number; ctx: Ctx; indice: number }) {
  const grupo = useRef<THREE.Group>(null)
  const { abierta, v } = useApertura()
  useFrame((_, dt) => {
    const obj = abierta ? 1 : 0
    if (Math.abs(v.current - obj) < 0.001) return
    v.current += (obj - v.current) * Math.min(1, dt * (6 - indice))
    if (grupo.current) grupo.current.position.z = v.current * prof * 0.55
  })
  const w = x1 - x0 - LUZ, h = y1 - y0 - LUZ
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const { estilo, mat } = ctx.tirador
  const caja = Math.max(0.06, h - 0.04)
  return (
    <group ref={grupo}>
      <Pieza w={w} h={h} d={T} p={[cx, cy, T / 2]} mat={ctx.frente} />
      {/* cajón interior */}
      <Pieza w={w - 0.05} h={0.012} d={prof - 0.06} p={[cx, cy - h / 2 + 0.03, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      <Pieza w={0.012} h={caja} d={prof - 0.06} p={[cx - w / 2 + 0.03, cy - h / 2 + 0.03 + caja / 2, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      <Pieza w={0.012} h={caja} d={prof - 0.06} p={[cx + w / 2 - 0.03, cy - h / 2 + 0.03 + caja / 2, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      {estilo === 'perfil'
        ? <Perfil x={cx} y={cy + h / 2 - 0.01} w={w} mat={mat} />
        : <Tirador x={cx} y={cy + h / 2 - Math.min(0.05, h / 3)} z={T - 0.009} vertical={false} largo={w * 0.6} estilo={estilo} mat={mat} />}
    </group>
  )
}

// ─── Cuerpo + frentes ───────────────────────────────────────────────────────

function anchosColumnas(cols: Columna[], total: number): number[] {
  const fijos = cols.reduce((a, c) => a + (c.ancho ? c.ancho * M : 0), 0)
  const libres = cols.filter(c => !c.ancho).length
  const resto = Math.max(0, total - fijos) / Math.max(1, libres)
  return cols.map(c => (c.ancho ? c.ancho * M : resto))
}

function Cuerpo({ w, h, d, ctx, estantes = 1 }: { w: number; h: number; d: number; ctx: Ctx; estantes?: number }) {
  const dc = d - T
  const z = -d / 2 + dc / 2
  return (
    <group>
      <Pieza w={T} h={h} d={dc} p={[-w / 2 + T / 2, h / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={T} h={h} d={dc} p={[w / 2 - T / 2, h / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={T} d={dc} p={[0, T / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={T} d={dc} p={[0, h - T / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={h - 2 * T} d={0.006} p={[0, h / 2, -d / 2 + 0.003]} mat={ctx.cuerpo} sombra={false} />
      {Array.from({ length: estantes }, (_, i) => (
        <Pieza key={i} w={w - 2 * T} h={T} d={dc - 0.03} p={[0, (h * (i + 1)) / (estantes + 1), z - 0.015]} mat={ctx.cuerpo} sombra={false} />
      ))}
    </group>
  )
}

/** Dibuja los frentes de un módulo recto de ancho w (m), en el rango vertical [y0, y1]. */
function Frentes({ cols, w, y0, y1, d, ctx, espejado }: { cols: Columna[]; w: number; y0: number; y1: number; d: number; ctx: Ctx; espejado?: boolean }) {
  const anchos = anchosColumnas(cols, w)
  const out: React.ReactNode[] = []
  const z = d / 2 - T
  const tiradorEn: 'arriba' | 'abajo' | 'medio' = ctx.tipo === 'bajo' || ctx.tipo === 'esquinero-bajo' ? 'arriba' : ctx.tipo === 'alto' ? 'medio' : 'abajo'
  let x = -w / 2
  cols.forEach((c, i) => {
    const cw = anchos[i]
    const x0 = x, x1 = x + cw
    x = x1
    const ultima = i === cols.length - 1
    const bisagraSimple: 'izq' | 'der' = (i === 0 && cols.length > 1) !== !!espejado ? 'izq' : (ultima && cols.length > 1) ? 'der' : espejado ? 'izq' : 'der'
    const k = `${i}`
    switch (c.tipo) {
      case 'puerta':
      case 'vidrio': {
        const vidrio = c.tipo === 'vidrio'
        if (cw > 0.62) {
          const xm = (x0 + x1) / 2
          out.push(<Hoja key={k + 'a'} x0={x0} x1={xm} y0={y0} y1={y1} bisagra="izq" ctx={ctx} vidrio={vidrio} tiradorEn={tiradorEn} />)
          out.push(<Hoja key={k + 'b'} x0={xm} x1={x1} y0={y0} y1={y1} bisagra="der" ctx={ctx} vidrio={vidrio} tiradorEn={tiradorEn} />)
        } else {
          out.push(<Hoja key={k} x0={x0} x1={x1} y0={y0} y1={y1} bisagra={bisagraSimple} ctx={ctx} vidrio={vidrio} tiradorEn={tiradorEn} />)
        }
        break
      }
      case 'rebatible':
        out.push(<Hoja key={k} x0={x0} x1={x1} y0={y0} y1={y1} bisagra="arriba" ctx={ctx} tiradorEn="abajo" />)
        break
      case 'ciego':
        out.push(<Pieza key={k} w={cw - LUZ} h={y1 - y0 - LUZ} d={T} p={[(x0 + x1) / 2, (y0 + y1) / 2, T / 2]} mat={ctx.frente} />)
        break
      case 'bandejero':
        out.push(<Cajon key={k} x0={x0} x1={x1} y0={y0} y1={y1} prof={d} ctx={ctx} indice={0} />)
        break
      case 'cajones': {
        const n = Math.max(1, c.cajones ?? 3)
        // El primer cajón es más bajo (cubiertos), el resto se reparte.
        const H = y1 - y0
        const primero = n >= 3 ? Math.min(0.16, H / n) : H / n
        const resto = (H - primero) / Math.max(1, n - 1)
        let yt = y1
        for (let j = 0; j < n; j++) {
          const hh = j === 0 ? primero : resto
          out.push(<Cajon key={k + j} x0={x0} x1={x1} y0={yt - hh} y1={yt} prof={d} ctx={ctx} indice={j} />)
          yt -= hh
        }
        break
      }
      case 'hueco':
        // Estante abierto: se ve el interior.
        out.push(<Pieza key={k} w={cw - 2 * T} h={T} d={d - 0.05} p={[(x0 + x1) / 2, (y0 + y1) / 2, -0.01]} mat={ctx.cuerpo} sombra={false} />)
        break
      case 'micro': {
        const H = y1 - y0
        const nicho = Math.min(0.4, H * (ctx.tipo === 'alto' ? 0.3 : 0.6))
        const nb = ctx.tipo === 'alto' ? y0 + H * 0.42 : y0
        const nt = nb + nicho
        out.push(<Pieza key={k + 'n'} w={cw - 2 * T} h={T} d={d - T} p={[(x0 + x1) / 2, nt + T / 2, -T / 2]} mat={ctx.cuerpo} />)
        if (y1 - nt > 0.12) out.push(<Hoja key={k + 's'} x0={x0} x1={x1} y0={nt + T} y1={y1} bisagra={cw > 0.5 ? 'arriba' : bisagraSimple} ctx={ctx} vidrio={false} tiradorEn="abajo" />)
        if (nb - y0 > 0.12) out.push(<Hoja key={k + 'i'} x0={x0} x1={x1} y0={y0} y1={nb} bisagra={bisagraSimple} ctx={ctx} tiradorEn="arriba" />)
        break
      }
    }
  })
  return <group position={[0, 0, z]}>{out}</group>
}

function ModuloRecto({ w, h, d, cols, ctx, conZocalo, espejado, gola }: { w: number; h: number; d: number; cols: Columna[]; ctx: Ctx; conZocalo: number; espejado?: boolean; gola: boolean }) {
  const zc = conZocalo
  const hb = h - zc
  const tieneVidrio = cols.some(c => c.tipo === 'vidrio')
  const golaH = gola && ctx.tipo === 'bajo' ? GOLA : 0
  return (
    <group>
      {zc > 0 && <Pieza w={w - 0.004} h={zc} d={0.016} p={[0, zc / 2, d / 2 - 0.06]} mat={ctx.zocalo} />}
      <group position={[0, zc, 0]}>
        <Cuerpo w={w} h={hb} d={d} ctx={ctx} estantes={ctx.tipo === 'alto' ? 3 : tieneVidrio ? 2 : 1} />
        <Frentes cols={cols} w={w} y0={0} y1={hb - golaH} d={d} ctx={ctx} espejado={espejado} />
        {golaH > 0 && <Pieza w={w - 2 * T} h={golaH} d={0.01} p={[0, hb - golaH / 2, d / 2 - 0.03]} mat={MAT.negro} sombra={false} />}
      </group>
    </group>
  )
}

/** Esquinero en L: un brazo contra la pared y otro hacia el lado `esquina`. */
function Esquinero({ w, h, d, ctx, zc, esquina, mesada }: { w: number; h: number; d: number; ctx: Ctx; zc: number; esquina: 'izq' | 'der'; mesada: { mat: THREE.Material; esp: number; prof: number } | null }) {
  const s = esquina === 'izq' ? -1 : 1
  const largoB = Math.max(0.2, w - d)
  const hb = h - zc
  return (
    <group>
      {/* brazo A (contra la pared) */}
      {zc > 0 && <Pieza w={w - d} h={zc} d={0.016} p={[-s * d / 2, zc / 2, d / 2 - 0.06]} mat={ctx.zocalo} />}
      <group position={[0, zc, 0]}>
        <Cuerpo w={w} h={hb} d={d} ctx={ctx} />
        <group position={[-s * d / 2, 0, 0]}>
          <Frentes cols={[{ tipo: 'puerta' }]} w={w - d} y0={0} y1={hb} d={d} ctx={ctx} espejado={esquina === 'der'} />
        </group>
      </group>
      {/* brazo B (perpendicular) */}
      <group position={[s * (w / 2 - d / 2), 0, d / 2 + largoB / 2]} rotation={[0, -s * Math.PI / 2, 0]}>
        {zc > 0 && <Pieza w={largoB} h={zc} d={0.016} p={[0, zc / 2, d / 2 - 0.06]} mat={ctx.zocalo} />}
        <group position={[0, zc, 0]}>
          <Cuerpo w={largoB} h={hb} d={d} ctx={ctx} />
          <Frentes cols={[{ tipo: 'puerta' }]} w={largoB} y0={0} y1={hb} d={d} ctx={ctx} espejado={esquina === 'izq'} />
        </group>
      </group>
      {mesada && (
        <group position={[0, h + mesada.esp / 2, 0]}>
          <Pieza w={w} h={mesada.esp} d={mesada.prof} p={[0, 0, -d / 2 + mesada.prof / 2]} mat={mesada.mat} />
          <Pieza w={mesada.prof} h={mesada.esp} d={w - mesada.prof} p={[s * (w / 2 - mesada.prof / 2), 0, -d / 2 + mesada.prof + (w - mesada.prof) / 2]} mat={mesada.mat} />
        </group>
      )}
    </group>
  )
}

export default function Mueble3D({ it }: { it: Item }) {
  const esc = useRender(s => s.escena)
  const def = it.modulo!
  const frenteDef: MatDef = it.frente ?? esc.materiales.frentes
  const cuerpoDef: MatDef = it.cuerpo ?? esc.materiales.cuerpos
  const tir = esc.tirador
  const ctx: Ctx = useMemo(() => ({
    frente: material(frenteDef),
    cuerpo: material(cuerpoDef),
    zocalo: material(esc.materiales.zocalo),
    tirador: { estilo: tir.estilo, mat: matColor(tir.color, 0.3, tir.metalico) },
    tipo: def.tipo,
    elev: it.elevacion,
  }), [frenteDef, cuerpoDef, esc.materiales.zocalo, tir, def.tipo, it.elevacion])

  const w = def.ancho * M, h = def.alto * M, d = def.profundidad * M
  const conZocalo = def.tipo === 'bajo' || def.tipo === 'esquinero-bajo' || def.tipo === 'alto' ? esc.estandares.zocalo * M : 0
  const est = esc.estandares
  const llevaMesadaPropia = (def.tipo === 'esquinero-bajo' || (it.ubicacion === 'libre' && def.tipo === 'bajo')) && (est.mesadaActiva || def.conMesada)
  const mesada = llevaMesadaPropia ? { mat: material(esc.materiales.mesada), esp: est.espesorMesada * M, prof: (it.ubicacion === 'libre' ? def.profundidad + 3 : est.profMesada) * M } : null

  if (def.tipo.startsWith('esquinero')) {
    return <Esquinero w={w} h={h} d={d} ctx={ctx} zc={conZocalo} esquina={it.esquina ?? 'izq'} mesada={mesada} />
  }
  return (
    <group>
      <ModuloRecto w={w} h={h} d={d} cols={def.columnas} ctx={ctx} conZocalo={conZocalo} espejado={it.espejado} gola={tir.estilo === 'gola'} />
      {mesada && <Pieza w={w + 0.03} h={mesada.esp} d={mesada.prof} p={[0, h + mesada.esp / 2, 0]} mat={mesada.mat} />}
    </group>
  )
}
