'use client'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Columna, DefModulo, EstiloTirador, Item, MatDef, ModeloTirador, PosTirador, TipoModulo, TipoPatas } from '@/lib/render/tipos'
import { hojas } from '@/lib/render/escena'
import { preset } from '@/lib/render/materiales'
import { cajaUV, M } from './geometria'
import { MAT, material, matColor } from './texturas'
import { useRender } from './store'

// Mueble paramétrico. Origen local: centro de la planta, a la altura de la
// base del mueble; el frente mira hacia +z. Medidas internas en metros.
//
// Los productos del catálogo traen su diseño relevado de la foto (disenos.ts):
// distribución de frentes, modelo de manija, patas, travesaño, frentes embutidos.
// Las manijas de esos productos siguen reglas fijas por tipo de frente (ver
// `manijaDe`) y NO dependen del tirador elegido para el ambiente, que solo se
// aplica a los módulos a medida. Cambiar colores solo cambia materiales.

const T = 0.018      // espesor de placa
const LUZ = 0.003    // luz entre frentes
const GOLA = 0.035
const TRAVESANO = 0.04

interface Ctx {
  frente: THREE.Material
  cuerpo: THREE.Material
  zocalo: THREE.Material
  acento: THREE.Material
  /** Tirador elegido para el ambiente (módulos a medida). */
  tirador: { estilo: EstiloTirador; mat: THREE.Material }
  /** Manija propia del producto; null = módulo a medida (usa `tirador`). */
  modelo: ModeloTirador | null
  tipo: TipoModulo
  /** Alto útil de los frentes (m), para ubicar manijas de columnas. */
  altoFrentes: number
  /** Hay huecos a la vista: se dibujan divisiones internas y estantes por celda. */
  conInterior: boolean
}

const MAT_MANIJA = {
  negra: matColor('#1b1b1c', 0.45, 0.25),
  cromo: matColor('#dfe2e5', 0.18, 0.95),
  unero: matColor('#2a2a2b', 0.85, 0),
  aluminio: matColor('#b9bcc0', 0.3, 0.85),
}
const MAT_PATA: Record<TipoPatas, THREE.Material> = {
  cromo: matColor('#cfd2d6', 0.22, 0.92),
  negra: matColor('#1a1a1b', 0.6, 0.1),
  aluminio: matColor('#a3a7ab', 0.38, 0.75),
}

function Pieza({ w, h, d, p, mat, sombra = true }: { w: number; h: number; d: number; p: [number, number, number]; mat: THREE.Material; sombra?: boolean }) {
  return <mesh geometry={cajaUV(w, h, d)} material={mat} position={p} castShadow={sombra} receiveShadow />
}

// ─── Tiradores ──────────────────────────────────────────────────────────────

/** Tirador del ambiente (módulos a medida). */
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

/** Manija del producto, ya ubicada (coordenadas del plano del frente). */
interface Manija {
  modelo: ModeloTirador
  x: number
  y: number
  orient: 'h' | 'v'
  largo: number
  /** Uñero: ancho de la ranura. */
  ancho?: number
}

/** Manija real del producto. z = cara exterior del frente. */
function ManijaProducto({ m, z }: { m: Manija; z: number }) {
  const h = m.orient === 'h'
  if (m.modelo === 'unero') {
    // Ranura oscura sobre el canto por donde se toma el frente.
    return <mesh position={[m.x, m.y, z + 0.0005]} material={MAT_MANIJA.unero} geometry={cajaUV(m.ancho ?? m.largo, 0.009, 0.002)} />
  }
  if (m.modelo === 'barra-negra') {
    // Barral plano negro, separado del frente por dos patitas.
    const l = m.largo
    return (
      <group position={[m.x, m.y, z]}>
        <mesh position={[0, 0, 0.022]} material={MAT_MANIJA.negra} castShadow geometry={cajaUV(h ? l : 0.012, h ? 0.012 : l, 0.008)} />
        {[-1, 1].map(k => (
          <mesh key={k} position={h ? [k * (l / 2 - 0.014), 0, 0.009] : [0, k * (l / 2 - 0.014), 0.009]} material={MAT_MANIJA.negra} geometry={cajaUV(0.008, 0.008, 0.018)} />
        ))}
      </group>
    )
  }
  if (m.modelo === 'arco-cromo') {
    // Manija de arco cromada (despenseros).
    const l = m.largo
    return (
      <group position={[m.x, m.y, z]} rotation={[0, 0, h ? Math.PI / 2 : 0]}>
        <mesh position={[0, 0, 0.026]} material={MAT_MANIJA.cromo} castShadow>
          <cylinderGeometry args={[0.005, 0.005, l - 0.03, 12]} />
        </mesh>
        {[-1, 1].map(k => (
          <mesh key={k} position={[0, k * (l / 2 - 0.02), 0.014]} rotation={[Math.PI / 2, 0, 0]} material={MAT_MANIJA.cromo}>
            <cylinderGeometry args={[0.0045, 0.0045, 0.028, 10]} />
          </mesh>
        ))}
      </group>
    )
  }
  return null
}

/**
 * Dónde va la manija de un frente de producto, según lo que muestran las fotos
 * del catálogo: barra negra horizontal (abajo en alacenas, arriba en bajos) del
 * lado que abre; rebatibles al centro del borde inferior; cajones al centro
 * arriba; despenseros con arco vertical. `pos` permite corregir un frente puntual.
 */
function manijaDe(
  clase: 'puerta' | 'rebatible' | 'cajon',
  x0: number, x1: number, y0: number, y1: number,
  bisagra: 'izq' | 'der' | 'arriba', ctx: Ctx, pos?: PosTirador,
): Manija | null {
  const modelo = ctx.modelo
  if (!modelo || modelo === 'ninguno') return null
  const w = x1 - x0 - LUZ, hh = y1 - y0 - LUZ
  const bajo = ctx.tipo === 'bajo' || ctx.tipo === 'esquinero-bajo'
  if (modelo === 'unero') {
    const arriba = pos?.pos ? pos.pos !== 'abajo' : clase === 'cajon' || bajo
    return { modelo, x: (x0 + x1) / 2, y: arriba ? y1 - LUZ / 2 - 0.0045 : y0 + LUZ / 2 + 0.0045, orient: 'h', largo: w, ancho: w - 0.004 }
  }
  const orient: 'h' | 'v' = clase !== 'puerta' ? 'h' : pos?.orient ?? (modelo === 'arco-cromo' ? 'v' : 'h')
  const largo = orient === 'h' ? Math.min(modelo === 'arco-cromo' ? 0.14 : 0.16, w * 0.7) : Math.min(modelo === 'arco-cromo' ? 0.16 : 0.16, hh * 0.6)

  let vpos: 'arriba' | 'abajo' | 'medio'
  if (pos?.pos) vpos = pos.pos
  else if (clase === 'rebatible') vpos = 'abajo'
  else if (clase === 'cajon') vpos = 'arriba'
  else if (bajo) vpos = 'arriba'
  else if (ctx.tipo === 'alto') {
    // Columnas: puerta entera → al medio; puerta de arriba → abajo; de abajo → arriba.
    vpos = hh >= ctx.altoFrentes * 0.6 ? 'medio' : (y0 + y1) / 2 > ctx.altoFrentes / 2 ? 'abajo' : 'arriba'
  } else vpos = 'abajo'
  const margenV = orient === 'h' ? (clase === 'cajon' ? Math.min(0.045, hh / 3) : 0.045) : (ctx.tipo === 'alto' ? 0.07 : 0.03) + largo / 2
  const y = vpos === 'arriba' ? y1 - margenV : vpos === 'abajo' ? y0 + margenV : (y0 + y1) / 2

  let lado: 'izq' | 'der' | 'centro'
  if (pos?.lado) lado = pos.lado
  else if (clase !== 'puerta' || bisagra === 'arriba') lado = 'centro'
  else lado = bisagra === 'izq' ? 'der' : 'izq'
  const margenH = orient === 'h' ? 0.03 + largo / 2 : 0.035
  if (w < 2 * margenH + 0.02) lado = 'centro'
  const x = lado === 'der' ? x1 - margenH : lado === 'izq' ? x0 + margenH : (x0 + x1) / 2
  return { modelo, x, y, orient, largo }
}

/** Perfil de aluminio sobre el canto del frente (estilo "perfil"). */
function Perfil({ x, y, w, mat }: { x: number; y: number; w: number; mat: THREE.Material }) {
  return <mesh position={[x, y, T / 2 + 0.006]} material={mat} castShadow geometry={cajaUV(w, 0.02, 0.012)} />
}

// ─── Hojas animadas ─────────────────────────────────────────────────────────

/**
 * Estado de apertura animado (0 cerrado → 1 abierto). `avanzar` se llama en cada
 * cuadro y devuelve true mientras siga animando.
 */
function useApertura() {
  const abierta = useRender(s => s.vista.puertasAbiertas)
  const v = useRef(0)
  const animando = useRef(false)
  const avanzar = (dt: number, velocidad: number) => {
    const obj = abierta ? 1 : 0
    if (v.current === obj) { animando.current = false; return false }
    // Con el render a demanda, el primer cuadro trae todo el tiempo que estuvo quieto:
    // se toma un paso normal. Después se usa el tiempo real (acotado), así en equipos
    // lentos la animación tarda lo mismo aunque dibuje menos cuadros.
    const paso = animando.current ? Math.min(dt, 0.25) : 1 / 60
    animando.current = true
    v.current += (obj - v.current) * Math.min(1, paso * velocidad)
    if (Math.abs(v.current - obj) < 0.002) v.current = obj // termina exacto en la posición final
    return true
  }
  return { abierta, v, avanzar }
}

/** Puerta con bisagra a un costado (o arriba si es rebatible). Coordenadas: rectángulo [x0,x1]×[y0,y1] en el plano del frente. */
function Hoja({ x0, x1, y0, y1, bisagra, ctx, vidrio = false, marco, tiradorEn, sinTirador = false, manija, mat }: {
  x0: number; x1: number; y0: number; y1: number; bisagra: 'izq' | 'der' | 'arriba'
  ctx: Ctx; vidrio?: boolean; marco?: 'frente' | 'aluminio'; tiradorEn: 'arriba' | 'abajo' | 'medio'; sinTirador?: boolean
  /** Manija del producto (si el mueble es del catálogo). */
  manija?: Manija | null
  mat?: THREE.Material
}) {
  const grupo = useRef<THREE.Group>(null)
  const { v, avanzar } = useApertura()
  const girar = () => {
    if (!grupo.current) return
    grupo.current.rotation.set(
      bisagra === 'arriba' ? -v.current * 1.35 : 0,
      bisagra === 'arriba' ? 0 : (bisagra === 'izq' ? -1 : 1) * v.current * 1.75,
      0,
    )
  }
  // Si cambia el lado de la bisagra con la puerta abierta, se recalcula el giro al instante.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(girar, [bisagra])
  useFrame((estado, dt) => {
    if (!avanzar(dt, 7)) return
    girar()
    estado.invalidate()
  })
  const w = x1 - x0 - LUZ, h = y1 - y0 - LUZ
  // El grupo pivota en la bisagra; la hoja se dibuja desplazada desde ahí.
  const pivote: [number, number, number] = bisagra === 'izq' ? [x0 + LUZ / 2, (y0 + y1) / 2, 0] : bisagra === 'der' ? [x1 - LUZ / 2, (y0 + y1) / 2, 0] : [(x0 + x1) / 2, y1 - LUZ / 2, 0]
  const centro: [number, number, number] = bisagra === 'izq' ? [w / 2, 0, T / 2] : bisagra === 'der' ? [-w / 2, 0, T / 2] : [0, -h / 2, T / 2]
  const { estilo, mat: matTir } = ctx.tirador
  const tx = bisagra === 'izq' ? centro[0] + w / 2 - 0.035 : bisagra === 'der' ? centro[0] - w / 2 + 0.035 : 0
  const ty = tiradorEn === 'arriba' ? centro[1] + h / 2 - 0.1 : tiradorEn === 'abajo' ? centro[1] - h / 2 + 0.1 : centro[1]
  const vertical = bisagra !== 'arriba'
  const producto = ctx.modelo !== null
  // Marco de la puerta vidriada: en productos, de la placa del frente o de aluminio;
  // en módulos a medida, del color del tirador (como siempre).
  const matMarco = producto ? (marco === 'aluminio' ? MAT_MANIJA.aluminio : (mat ?? ctx.frente)) : ctx.tirador.mat
  const anchoMarco = producto && marco !== 'aluminio' ? 0.05 : 0.045
  return (
    <group position={pivote}>
      <group ref={grupo}>
        {vidrio ? (
          <group position={centro}>
            {/* marco + vidrio */}
            <Pieza w={w} h={anchoMarco} d={T} p={[0, h / 2 - anchoMarco / 2, 0]} mat={matMarco} />
            <Pieza w={w} h={anchoMarco} d={T} p={[0, -h / 2 + anchoMarco / 2, 0]} mat={matMarco} />
            <Pieza w={anchoMarco} h={h - 2 * anchoMarco} d={T} p={[-w / 2 + anchoMarco / 2, 0, 0]} mat={matMarco} />
            <Pieza w={anchoMarco} h={h - 2 * anchoMarco} d={T} p={[w / 2 - anchoMarco / 2, 0, 0]} mat={matMarco} />
            <mesh position={[0, 0, 0]} material={MAT.vidrio} geometry={cajaUV(w - 2 * anchoMarco, h - 2 * anchoMarco, 0.004)} />
          </group>
        ) : (
          <Pieza w={w} h={h} d={T} p={centro} mat={mat ?? ctx.frente} />
        )}
        {producto
          ? manija && <group position={[-pivote[0], -pivote[1], 0]}><ManijaProducto m={manija} z={T} /></group>
          : <>
            {!sinTirador && estilo === 'perfil' && (
              <Perfil x={centro[0]} y={tiradorEn === 'abajo' ? centro[1] - h / 2 + 0.01 : centro[1] + h / 2 - 0.01} w={w} mat={matTir} />
            )}
            {!sinTirador && (
              <Tirador x={tx} y={ty} z={centro[2] + T / 2 - 0.009} vertical={vertical} largo={Math.min(w, h) * 0.6} estilo={estilo} mat={matTir} />
            )}
          </>}
      </group>
    </group>
  )
}

/** Cajón que sale hacia adelante al "abrir". */
function Cajon({ x0, x1, y0, y1, prof, ctx, indice, manija, mat }: { x0: number; x1: number; y0: number; y1: number; prof: number; ctx: Ctx; indice: number; manija?: Manija | null; mat?: THREE.Material }) {
  const grupo = useRef<THREE.Group>(null)
  const { v, avanzar } = useApertura()
  useFrame((estado, dt) => {
    if (!avanzar(dt, Math.max(3, 7 - indice))) return
    if (grupo.current) grupo.current.position.z = v.current * prof * 0.55
    estado.invalidate()
  })
  const w = x1 - x0 - LUZ, h = y1 - y0 - LUZ
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const { estilo, mat: matTir } = ctx.tirador
  const caja = Math.max(0.06, h - 0.04)
  return (
    <group ref={grupo}>
      <Pieza w={w} h={h} d={T} p={[cx, cy, T / 2]} mat={mat ?? ctx.frente} />
      {/* cajón interior */}
      <Pieza w={w - 0.05} h={0.012} d={prof - 0.06} p={[cx, cy - h / 2 + 0.03, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      <Pieza w={0.012} h={caja} d={prof - 0.06} p={[cx - w / 2 + 0.03, cy - h / 2 + 0.03 + caja / 2, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      <Pieza w={0.012} h={caja} d={prof - 0.06} p={[cx + w / 2 - 0.03, cy - h / 2 + 0.03 + caja / 2, -(prof - 0.06) / 2]} mat={ctx.cuerpo} sombra={false} />
      {ctx.modelo !== null
        ? manija && <ManijaProducto m={manija} z={T} />
        : estilo === 'perfil'
          ? <Perfil x={cx} y={cy + h / 2 - 0.01} w={w} mat={matTir} />
          : <Tirador x={cx} y={cy + h / 2 - Math.min(0.05, h / 3)} z={T - 0.009} vertical={false} largo={w * 0.6} estilo={estilo} mat={matTir} />}
    </group>
  )
}

// ─── Cuerpo + frentes ───────────────────────────────────────────────────────

/** Reparte un largo total (m) entre celdas con medida fija (cm) y celdas libres. */
function repartir(medidasCm: (number | undefined)[], total: number): number[] {
  const fijos = medidasCm.reduce<number>((a, c) => a + (c ? c * M : 0), 0)
  const libres = medidasCm.filter(c => !c).length
  // Sin celdas libres, las fijas se estiran o achican hasta llenar; con libres, las
  // fijas conservan su medida salvo que ya no entren (mueble angostado a mano).
  const k = !fijos ? 1 : !libres ? total / fijos : fijos > total * 0.9 ? (total * 0.7) / fijos : 1
  const resto = Math.max(0, total - fijos * k) / Math.max(1, libres)
  return medidasCm.map(c => (c ? c * M * k : resto))
}

function Cuerpo({ w, h, d, ctx, estantes = 1, embutido = false }: { w: number; h: number; d: number; ctx: Ctx; estantes?: number; embutido?: boolean }) {
  // Con frentes embutidos los laterales, techo y piso llegan hasta adelante.
  const dc = embutido ? d : d - T
  const z = -d / 2 + dc / 2
  return (
    <group>
      <Pieza w={T} h={h} d={dc} p={[-w / 2 + T / 2, h / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={T} h={h} d={dc} p={[w / 2 - T / 2, h / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={T} d={dc} p={[0, T / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={T} d={dc} p={[0, h - T / 2, z]} mat={ctx.cuerpo} />
      <Pieza w={w - 2 * T} h={h - 2 * T} d={0.006} p={[0, h / 2, -d / 2 + 0.003]} mat={ctx.cuerpo} sombra={false} />
      {Array.from({ length: estantes }, (_, i) => (
        <Pieza key={i} w={w - 2 * T} h={T} d={dc - 0.03 - (embutido ? T : 0)} p={[0, (h * (i + 1)) / (estantes + 1), z - 0.015 - (embutido ? T / 2 : 0)]} mat={ctx.cuerpo} sombra={false} />
      ))}
    </group>
  )
}

const ABIERTOS = new Set(['hueco', 'botellero', 'micro'])

/** Bisagra por defecto de una puerta según su lugar en el grupo. */
function bisagraAuto(c: Columna, i: number, grupo: Columna[], ctx: Ctx, espejado?: boolean): 'izq' | 'der' {
  if (c.bisagra) return c.bisagra
  if (ctx.modelo === null) {
    // Módulos a medida: regla de siempre (primera a la izquierda, última a la derecha).
    const ultima = i === grupo.length - 1
    return (i === 0 && grupo.length > 1) !== !!espejado ? 'izq' : (ultima && grupo.length > 1) ? 'der' : espejado ? 'izq' : 'der'
  }
  // Productos: abre hacia la derecha, salvo la última puerta de un grupo de varias.
  const puertas = grupo.map((g, j) => ({ g, j })).filter(x => !x.g.filas && !x.g.columnas && (x.g.tipo === 'puerta' || x.g.tipo === 'vidrio'))
  const ultimaPuerta = puertas.length > 1 && puertas[puertas.length - 1].j === i
  const lado = ultimaPuerta ? 'der' : 'izq'
  return espejado ? (lado === 'izq' ? 'der' : 'izq') : lado
}

interface Rect { x0: number; x1: number; y0: number; y1: number }

/**
 * Arma los frentes de una celda (y sus subceldas) en el rectángulo dado, en
 * coordenadas del plano del frente (z = 0 es la cara delantera del cuerpo).
 */
function armar(out: React.ReactNode[], cols: Columna[], r: Rect, d: number, ctx: Ctx, clave: string, espejado: boolean | undefined, modo: 'columnas' | 'filas') {
  const total = modo === 'columnas' ? r.x1 - r.x0 : r.y1 - r.y0
  const tamanos = repartir(cols.map(c => (modo === 'columnas' ? c.ancho : c.alto)), total)
  const dInt = d - T - 0.004
  let cursor = modo === 'columnas' ? r.x0 : r.y1
  cols.forEach((c, i) => {
    const t = tamanos[i]
    const sub: Rect = modo === 'columnas' ? { ...r, x0: cursor, x1: cursor + t } : { ...r, y1: cursor, y0: cursor - t }
    cursor = modo === 'columnas' ? cursor + t : cursor - t
    const k = `${clave}${modo[0]}${i}`
    // División interna entre celdas (solo hace falta si hay huecos a la vista).
    if (ctx.conInterior && i > 0) {
      out.push(modo === 'columnas'
        ? <Pieza key={k + 'dv'} w={T} h={r.y1 - r.y0} d={dInt} p={[sub.x0, (r.y0 + r.y1) / 2, -dInt / 2]} mat={ctx.cuerpo} sombra={false} />
        : <Pieza key={k + 'dh'} w={r.x1 - r.x0} h={T} d={dInt} p={[(r.x0 + r.x1) / 2, sub.y1, -dInt / 2]} mat={ctx.cuerpo} sombra={false} />)
    }
    if (c.filas) armar(out, c.filas, sub, d, ctx, k, espejado, 'filas')
    else if (c.columnas) armar(out, c.columnas, sub, d, ctx, k, espejado, 'columnas')
    else celda(out, c, sub, d, ctx, k, modo === 'columnas' ? bisagraAuto(c, i, cols, ctx, espejado) : bisagraAuto(c, 0, [c], ctx, espejado))
  })
}

/** Una celda final: puerta, cajones, hueco, etc. */
function celda(out: React.ReactNode[], c: Columna, r: Rect, d: number, ctx: Ctx, k: string, bisagra: 'izq' | 'der') {
  const { x0, x1, y0, y1 } = r
  const cw = x1 - x0, H = y1 - y0
  const producto = ctx.modelo !== null
  const tiradorEn: 'arriba' | 'abajo' | 'medio' = ctx.tipo === 'bajo' || ctx.tipo === 'esquinero-bajo' ? 'arriba' : ctx.tipo === 'alto' ? 'medio' : 'abajo'
  const mat = c.acento ? ctx.acento : undefined
  const dInt = d - T - 0.004
  // Estantes detrás de las puertas cuando el mueble tiene divisiones propias.
  const estantesInternos = (n: number) => {
    if (!ctx.conInterior) return
    for (let j = 1; j <= n; j++) out.push(<Pieza key={`${k}ei${j}`} w={cw - T} h={T} d={dInt - 0.02} p={[(x0 + x1) / 2, y0 + (H * j) / (n + 1), -dInt / 2 - 0.01]} mat={ctx.cuerpo} sombra={false} />)
  }
  switch (c.tipo) {
    case 'puerta':
    case 'vidrio': {
      const vidrio = c.tipo === 'vidrio'
      if (!producto && cw > 0.62) {
        // Módulos a medida: una columna ancha se parte en dos hojas.
        const xm = (x0 + x1) / 2
        out.push(<Hoja key={k + 'a'} x0={x0} x1={xm} y0={y0} y1={y1} bisagra="izq" ctx={ctx} vidrio={vidrio} tiradorEn={tiradorEn} />)
        out.push(<Hoja key={k + 'b'} x0={xm} x1={x1} y0={y0} y1={y1} bisagra="der" ctx={ctx} vidrio={vidrio} tiradorEn={tiradorEn} />)
      } else {
        out.push(<Hoja key={k} x0={x0} x1={x1} y0={y0} y1={y1} bisagra={bisagra} ctx={ctx} vidrio={vidrio} marco={c.marco} tiradorEn={tiradorEn} mat={mat}
          manija={manijaDe('puerta', x0, x1, y0, y1, bisagra, ctx, c.tirador)} />)
      }
      estantesInternos(H > 1 ? (vidrio ? 4 : 3) : H > 0.45 ? 1 : 0)
      break
    }
    case 'rebatible':
      out.push(<Hoja key={k} x0={x0} x1={x1} y0={y0} y1={y1} bisagra="arriba" ctx={ctx} tiradorEn="abajo" mat={mat}
        manija={manijaDe('rebatible', x0, x1, y0, y1, 'arriba', ctx, c.tirador)} />)
      break
    case 'ciego':
      out.push(<Pieza key={k} w={cw - LUZ} h={H - LUZ} d={T} p={[(x0 + x1) / 2, (y0 + y1) / 2, T / 2]} mat={mat ?? ctx.frente} />)
      break
    case 'bandejero':
      out.push(<Cajon key={k} x0={x0} x1={x1} y0={y0} y1={y1} prof={d} ctx={ctx} indice={0} mat={mat}
        manija={manijaDe('cajon', x0, x1, y0, y1, 'arriba', ctx, c.tirador)} />)
      break
    case 'cajones': {
      const n = Math.max(1, c.cajones ?? 3)
      let altos: number[]
      if (c.alturas && c.alturas.length === n) {
        const suma = c.alturas.reduce((a, b) => a + b, 0)
        altos = c.alturas.map(a => (H * a) / suma)
      } else {
        // El primer cajón es más bajo (cubiertos), el resto se reparte.
        const primero = n >= 3 ? Math.min(0.16, H / n) : H / n
        const resto = (H - primero) / Math.max(1, n - 1)
        altos = Array.from({ length: n }, (_, j) => (j === 0 ? primero : resto))
      }
      let yt = y1
      altos.forEach((hh, j) => {
        out.push(<Cajon key={k + j} x0={x0} x1={x1} y0={yt - hh} y1={yt} prof={d} ctx={ctx} indice={j} mat={mat}
          manija={manijaDe('cajon', x0, x1, yt - hh, yt, 'arriba', ctx, c.tirador)} />)
        yt -= hh
      })
      break
    }
    case 'hueco': {
      // Hueco abierto con sus estantes (sin valor: uno al medio, como siempre).
      const n = c.estantes ?? 1
      for (let j = 1; j <= n; j++) {
        out.push(<Pieza key={`${k}e${j}`} w={cw - (producto ? T : 2 * T)} h={T} d={producto ? dInt : d - 0.05} p={[(x0 + x1) / 2, y0 + (H * j) / (n + 1), producto ? -dInt / 2 : -0.01]} mat={ctx.cuerpo} sombra={false} />)
      }
      if (c.acento) {
        // Recuadro de color: fondo y laterales interiores en el material de acento.
        out.push(<Pieza key={k + 'af'} w={cw - T} h={H - T} d={0.004} p={[(x0 + x1) / 2, (y0 + y1) / 2, -dInt + 0.004]} mat={ctx.acento} sombra={false} />)
        out.push(<Pieza key={k + 'ab'} w={cw - T} h={0.004} d={dInt} p={[(x0 + x1) / 2, y0 + T / 2 + 0.002, -dInt / 2]} mat={ctx.acento} sombra={false} />)
        out.push(<Pieza key={k + 'at'} w={cw - T} h={0.004} d={dInt} p={[(x0 + x1) / 2, y1 - T / 2 - 0.002, -dInt / 2]} mat={ctx.acento} sombra={false} />)
        out.push(<Pieza key={k + 'al'} w={0.004} h={H - T} d={dInt} p={[x0 + T / 2 + 0.002, (y0 + y1) / 2, -dInt / 2]} mat={ctx.acento} sombra={false} />)
        out.push(<Pieza key={k + 'ar'} w={0.004} h={H - T} d={dInt} p={[x1 - T / 2 - 0.002, (y0 + y1) / 2, -dInt / 2]} mat={ctx.acento} sombra={false} />)
      }
      break
    }
    case 'botellero': {
      // Fila de casilleros abiertos.
      const n = Math.max(1, c.divisiones ?? 4)
      for (let j = 1; j < n; j++) {
        out.push(<Pieza key={`${k}b${j}`} w={T} h={H - T} d={dInt} p={[x0 + (cw * j) / n, (y0 + y1) / 2, -dInt / 2]} mat={ctx.cuerpo} sombra={false} />)
      }
      break
    }
    case 'micro': {
      const nicho = Math.min(0.4, H * (ctx.tipo === 'alto' ? 0.3 : 0.6))
      const nb = ctx.tipo === 'alto' ? y0 + H * 0.42 : y0
      const nt = nb + nicho
      out.push(<Pieza key={k + 'n'} w={cw - 2 * T} h={T} d={d - T} p={[(x0 + x1) / 2, nt + T / 2, -T / 2]} mat={ctx.cuerpo} />)
      if (y1 - nt > 0.12) {
        const bis = cw > 0.5 ? 'arriba' : bisagra
        out.push(<Hoja key={k + 's'} x0={x0} x1={x1} y0={nt + T} y1={y1} bisagra={bis} ctx={ctx} vidrio={false} tiradorEn="abajo"
          manija={manijaDe(bis === 'arriba' ? 'rebatible' : 'puerta', x0, x1, nt + T, y1, bis, ctx, c.tirador)} />)
      }
      if (nb - y0 > 0.12) {
        out.push(<Hoja key={k + 'i'} x0={x0} x1={x1} y0={y0} y1={nb} bisagra={bisagra} ctx={ctx} tiradorEn="arriba"
          manija={manijaDe('puerta', x0, x1, y0, nb, bisagra, ctx, { ...c.tirador, pos: c.tirador?.pos ?? 'arriba' })} />)
      }
      break
    }
  }
}

/** Dibuja los frentes de un módulo recto en el rectángulo dado. */
function Frentes({ cols, r, d, ctx, espejado, z }: { cols: Columna[]; r: Rect; d: number; ctx: Ctx; espejado?: boolean; z: number }) {
  const out: React.ReactNode[] = []
  armar(out, cols, r, d, ctx, 'f', espejado, 'columnas')
  return <group position={[0, 0, z]}>{out}</group>
}

/** Patas a la vista (en lugar de zócalo). */
function Patas({ w, d, alto, tipo }: { w: number; d: number; alto: number; tipo: TipoPatas }) {
  const mat = MAT_PATA[tipo]
  const xs = [-w / 2 + 0.045, w / 2 - 0.045]
  const zs = [d / 2 - 0.07, -d / 2 + 0.06]
  return (
    <group>
      {xs.flatMap(x => zs.map(z => (
        tipo === 'aluminio'
          ? <Pieza key={`${x}|${z}`} w={0.032} h={alto} d={0.032} p={[x, alto / 2, z]} mat={mat} />
          : (
            <group key={`${x}|${z}`} position={[x, 0, z]}>
              <mesh position={[0, alto / 2, 0]} material={mat} castShadow>
                <cylinderGeometry args={tipo === 'negra' ? [0.016, 0.02, alto, 14] : [0.014, 0.014, alto, 14]} />
              </mesh>
              {tipo === 'negra' && (
                <mesh position={[0, 0.006, 0]} material={mat}><cylinderGeometry args={[0.026, 0.026, 0.012, 16]} /></mesh>
              )}
            </group>
          )
      )))}
    </group>
  )
}

function ModuloRecto({ w, h, d, cols, ctx, conZocalo, espejado, gola, def, rango }: {
  w: number; h: number; d: number; cols: Columna[]; ctx: Ctx; conZocalo: number; espejado?: boolean; gola: boolean
  def: Pick<DefModulo, 'patas' | 'travesano' | 'embutido'>
  /** Tramo del ancho (m, en coordenadas locales) que ocupan los frentes; por defecto todo. */
  rango?: [number, number]
}) {
  const zc = conZocalo
  const hb = h - zc
  const tieneVidrio = hojas(cols).some(c => c.tipo === 'vidrio')
  const bajo = ctx.tipo === 'bajo' || ctx.tipo === 'esquinero-bajo'
  const golaH = gola && ctx.tipo === 'bajo' && ctx.modelo === null ? GOLA : 0
  const trav = def.travesano && bajo ? TRAVESANO : 0
  const emb = !!def.embutido
  const [fx0, fx1] = rango ?? [-w / 2, w / 2]
  // Frentes embutidos: quedan dentro de laterales, techo y piso.
  const r: Rect = {
    x0: fx0 + (emb && fx0 <= -w / 2 + 1e-6 ? T : 0),
    x1: fx1 - (emb && fx1 >= w / 2 - 1e-6 ? T : 0),
    y0: emb ? T : 0,
    y1: hb - golaH - trav - (emb && !trav ? T : 0),
  }
  const estantes = ctx.conInterior ? 0 : ctx.tipo === 'alto' ? 3 : tieneVidrio ? 2 : 1
  return (
    <group>
      {zc > 0 && (def.patas
        ? <Patas w={w} d={d} alto={zc} tipo={def.patas} />
        : <Pieza w={w - 0.004} h={zc} d={0.016} p={[0, zc / 2, d / 2 - 0.06]} mat={ctx.zocalo} />)}
      <group position={[0, zc, 0]}>
        <Cuerpo w={w} h={hb} d={d} ctx={ctx} estantes={estantes} embutido={emb} />
        <Frentes cols={cols} r={r} d={d} ctx={ctx} espejado={espejado} z={d / 2 - T} />
        {golaH > 0 && <Pieza w={w - 2 * T} h={golaH} d={0.01} p={[0, hb - golaH / 2, d / 2 - 0.03]} mat={MAT.negro} sombra={false} />}
        {trav > 0 && (
          // Listón frontal del cuerpo (arriba de puertas y cajones, debajo de la mesada).
          <Pieza w={(fx1 - fx0) - (emb ? 2 * T : 0)} h={trav} d={T} p={[(fx0 + fx1) / 2, hb - trav / 2, d / 2 - T / 2]} mat={ctx.cuerpo} />
        )}
      </group>
    </group>
  )
}

/**
 * Columnas de un brazo de esquinero: vienen ordenadas desde el extremo hacia el
 * rincón; se dan vuelta si el rincón queda a la izquierda, y las puertas sin
 * bisagra indicada la llevan del lado del extremo.
 */
function brazo(cols: Columna[], invertir: boolean, exterior: 'izq' | 'der'): Columna[] {
  const fijar = (c: Columna): Columna => c.filas ? { ...c, filas: c.filas.map(fijar) } : c.columnas ? { ...c, columnas: c.columnas.map(fijar) }
    : (c.tipo === 'puerta' || c.tipo === 'vidrio') && !c.bisagra ? { ...c, bisagra: exterior } : c
  const r = cols.map(fijar)
  return invertir ? r.reverse() : r
}

/** Esquinero en L: un brazo contra la pared y otro hacia el lado `esquina`. */
function Esquinero({ w, h, d, ctx, zc, esquina, mesada, def }: {
  w: number; h: number; d: number; ctx: Ctx; zc: number; esquina: 'izq' | 'der'
  mesada: { mat: THREE.Material; esp: number; prof: number } | null; def: DefModulo
}) {
  const s = esquina === 'izq' ? -1 : 1
  const largoB = Math.max(0.2, w - d)
  const colsA = brazo(def.columnas.length ? def.columnas : [{ tipo: 'puerta' }], esquina === 'izq', esquina === 'izq' ? 'der' : 'izq')
  const colsB = brazo(def.columnasB?.length ? def.columnasB : [{ tipo: 'puerta' }], esquina === 'der', esquina === 'der' ? 'der' : 'izq')
  const rangoA: [number, number] = s === 1 ? [-w / 2, w / 2 - d] : [-w / 2 + d, w / 2]
  return (
    <group>
      {/* brazo A (contra la pared) */}
      <ModuloRecto w={w} h={h} d={d} cols={colsA} ctx={ctx} conZocalo={zc} gola={false} def={def} rango={rangoA} />
      {/* brazo B (perpendicular) */}
      <group position={[s * (w / 2 - d / 2), 0, d / 2 + largoB / 2]} rotation={[0, -s * Math.PI / 2, 0]}>
        <ModuloRecto w={largoB} h={h} d={d} cols={colsB} ctx={ctx} conZocalo={zc} gola={false} def={def} />
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
  // Suscripciones puntuales: mover otro mueble no vuelve a dibujar este.
  const materiales = useRender(s => s.escena.materiales)
  const tir = useRender(s => s.escena.tirador)
  const est = useRender(s => s.escena.estandares)
  const def = it.modulo!
  const frenteDef: MatDef = it.frente ?? materiales.frentes
  const cuerpoDef: MatDef = it.cuerpo ?? materiales.cuerpos
  const w = def.ancho * M, h = def.alto * M, d = def.profundidad * M
  const conZocalo = def.tipo === 'bajo' || def.tipo === 'esquinero-bajo' || def.tipo === 'alto' ? est.zocalo * M : 0
  // Acento del producto (recuadro de mármol, frentes rústicos): es parte del diseño.
  const acentoMat = def.acento ? preset(def.acento) : frenteDef
  const conInterior = def.tirador !== undefined && (hojas(def.columnas).some(c => ABIERTOS.has(c.tipo)) || !!def.columnasB?.some(c => hojas([c]).some(x => ABIERTOS.has(x.tipo))))
  const ctx: Ctx = useMemo(() => ({
    frente: material(frenteDef),
    cuerpo: material(cuerpoDef),
    zocalo: material(materiales.zocalo),
    acento: material(acentoMat),
    tirador: { estilo: tir.estilo, mat: matColor(tir.color, 0.3, tir.metalico) },
    modelo: def.tirador ?? null,
    tipo: def.tipo,
    altoFrentes: h - conZocalo,
    conInterior,
  }), [frenteDef, cuerpoDef, acentoMat, materiales.zocalo, tir, def.tirador, def.tipo, h, conZocalo, conInterior])

  const llevaMesadaPropia = (def.tipo === 'esquinero-bajo' || (it.ubicacion === 'libre' && def.tipo === 'bajo')) && (est.mesadaActiva || def.conMesada)
  const mesada = llevaMesadaPropia ? { mat: material(materiales.mesada), esp: est.espesorMesada * M, prof: (it.ubicacion === 'libre' ? def.profundidad + 3 : est.profMesada) * M } : null

  if (def.tipo.startsWith('esquinero')) {
    return <Esquinero w={w} h={h} d={d} ctx={ctx} zc={conZocalo} esquina={it.esquina ?? 'izq'} mesada={mesada} def={def} />
  }
  return (
    <group>
      <ModuloRecto w={w} h={h} d={d} cols={def.columnas} ctx={ctx} conZocalo={conZocalo} espejado={it.espejado} gola={tir.estilo === 'gola'} def={def} />
      {mesada && <Pieza w={w + 0.03} h={mesada.esp} d={mesada.prof} p={[0, h + mesada.esp / 2, 0]} mat={mesada.mat} />}
    </group>
  )
}
