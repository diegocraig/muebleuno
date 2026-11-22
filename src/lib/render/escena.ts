import type {
  Abertura, DefElectro, DefModulo, Escena, Estandares, Item, Pared, ProductoCatalogo, Presupuesto, Ubicacion,
} from './tipos'
import { preset } from './materiales'

// Lógica pura de la escena (sin three.js): posiciones en planta, colisiones,
// imanes, tramos de mesada, autocompletado y cálculo del presupuesto.

export const uid = () => Math.random().toString(36).slice(2, 10)

export const ESTANDARES_DEFAULT: Estandares = {
  zocalo: 10,
  alturaBajo: 85,
  profBajo: 58,
  espesorMesada: 2.5,
  profMesada: 61,
  mesadaActiva: true,
  lineaAlacenas: 210,
  profAlacena: 30,
  salpicadero: true,
}

export function escenaInicial(): Escena {
  return {
    version: 1,
    ambiente: {
      ancho: 360,
      largo: 300,
      alto: 260,
      paredes: { fondo: true, izq: true, der: true, frente: false },
      aberturas: [
        { id: uid(), pared: 'der', tipo: 'ventana', s: 120, ancho: 120, alto: 110, elevacion: 105 },
        { id: uid(), pared: 'izq', tipo: 'puerta', s: 180, ancho: 85, alto: 205, elevacion: 0 },
      ],
    },
    estandares: { ...ESTANDARES_DEFAULT },
    materiales: {
      frentes: preset('blanco'),
      cuerpos: preset('blanco'),
      mesada: preset('granito-gris-mara'),
      zocalo: preset('acero-inox'),
      salpicadero: preset('subway'),
      paredes: preset('pintura-blanca'),
      piso: preset('porcellanato-60'),
      techo: preset('pintura-blanca'),
    },
    tirador: { estilo: 'barra', color: '#b9bcc0', metalico: 0.9 },
    luces: {
      preset: 'dia',
      exposicion: 0.85,
      ambiente: 0.3,
      entorno: 0.4,
      sol: { activo: true, azimut: 90, elevacion: 30, intensidad: 2.4, temperatura: 5600 },
      techo: { activo: true, filas: 2, columnas: 2, intensidad: 4, temperatura: 3500, tipo: 'spot' },
      led: { activo: false, intensidad: 4, temperatura: 3000 },
      sombras: true,
      fondo: '#e9e7e3',
    },
    items: [],
  }
}

export const PRESUPUESTO_DEFAULT: Presupuesto = {
  extras: [],
  mesadaPorMetro: false,
  precioMesadaMl: 0,
  incluirElectros: false,
  descuentoPct: 0,
  tipoEnvioId: null,
  notas: '',
  validezDias: 15,
}

// ─── Medidas de cada ítem ───────────────────────────────────────────────────

export interface Medidas { ancho: number; alto: number; prof: number }

export function medidas(it: Item): Medidas {
  if (it.modulo) return { ancho: it.modulo.ancho, alto: it.modulo.alto, prof: it.modulo.profundidad }
  if (it.deco) return { ancho: it.deco.ancho, alto: it.deco.alto, prof: it.deco.profundidad }
  const e = it.electro!
  return { ancho: e.ancho, alto: e.alto, prof: e.profundidad }
}

export const esEsquinero = (it: Item) => !!it.modulo?.tipo.startsWith('esquinero')

/** Nivel "lógico": define a qué altura va por defecto y con qué choca. */
export type Nivel = 'bajo' | 'alto' | 'piso' | 'mesada' | 'colgante' | 'deco'

export function nivel(it: Item): Nivel {
  if (it.modulo) {
    const t = it.modulo.tipo
    if (t === 'bajo' || t === 'esquinero-bajo') return 'bajo'
    if (t === 'alto') return 'piso'
    return 'alto'
  }
  if (it.deco) return 'deco'
  switch (it.electro!.tipo) {
    case 'anafe': case 'bacha': return 'mesada'
    case 'campana': case 'microondas': return 'colgante'
    case 'lavavajillas': case 'lavarropas': return 'bajo'
    case 'horno': return 'bajo'
    default: return 'piso'
  }
}

export function topeMesada(est: Estandares) {
  return est.alturaBajo + est.espesorMesada
}

export function elevacionPorDefecto(def: DefModulo | null, electro: DefElectro | null, est: Estandares): number {
  if (def) {
    if (def.tipo === 'alacena' || def.tipo === 'esquinero-alto') {
      return Math.max(topeMesada(est) + 45, est.lineaAlacenas - def.alto)
    }
    return 0
  }
  const e = electro!
  switch (e.tipo) {
    case 'anafe': case 'bacha': return topeMesada(est) // apoya sobre la mesada
    case 'campana': return topeMesada(est) + 65
    case 'microondas': return topeMesada(est)
    case 'horno': return est.zocalo + 3
    default: return 0
  }
}

/**
 * Lado hacia el que sale el brazo de un esquinero ('izq'/'der' en coordenadas
 * locales del mueble) para que apunte a la esquina más cercana.
 */
export function esquinaPorDefecto(pared: Pared, s: number, largo: number): 'izq' | 'der' {
  const cercaDelInicio = s < largo / 2
  const invertida = pared === 'izq' || pared === 'frente'
  return cercaDelInicio !== invertida ? 'izq' : 'der'
}

/** Largo útil de cada pared (cm). */
export function largoPared(esc: Escena, p: Pared) {
  return p === 'fondo' || p === 'frente' ? esc.ambiente.ancho : esc.ambiente.largo
}

// ─── Planta: caja envolvente en el mundo (cm) ───────────────────────────────

export interface Caja { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }

/** Centro en planta + rotación (grados) de un ítem; la profundidad mira hacia +z local. */
/** Solo hace falta el ambiente: así los componentes 3D no dependen de toda la escena. */
export type ConAmbiente = { ambiente: Escena['ambiente'] }

export function transformar(it: Item, esc: ConAmbiente): { cx: number; cz: number; rot: number } {
  const { ancho, prof: p } = medidas(it)
  const prof = p + 2 * (it.separacion ?? 0) // el centro se corre `separacion` desde la pared
  const W = esc.ambiente.ancho, D = esc.ambiente.largo
  const s = it.s
  switch (it.ubicacion) {
    case 'fondo': return { cx: s + ancho / 2, cz: prof / 2, rot: 0 }
    case 'frente': return { cx: s + ancho / 2, cz: D - prof / 2, rot: 180 }
    case 'izq': return { cx: prof / 2, cz: s + ancho / 2, rot: 90 }
    case 'der': return { cx: W - prof / 2, cz: s + ancho / 2, rot: -90 }
    default: return { cx: it.x ?? W / 2, cz: it.z ?? D / 2, rot: it.rot ?? 0 }
  }
}

export function caja(it: Item, esc: ConAmbiente): Caja {
  const { ancho, alto, prof } = medidas(it)
  const y0 = it.elevacion, y1 = it.elevacion + alto
  const W = esc.ambiente.ancho, D = esc.ambiente.largo
  if (esEsquinero(it)) {
    // Ocupa un cuadrado ancho × ancho contra la esquina.
    const lado = it.esquina ?? 'izq'
    switch (it.ubicacion) {
      case 'fondo': return lado === 'izq'
        ? { x0: it.s, x1: it.s + ancho, z0: 0, z1: ancho, y0, y1 }
        : { x0: it.s, x1: it.s + ancho, z0: 0, z1: ancho, y0, y1 }
      case 'frente': return { x0: it.s, x1: it.s + ancho, z0: D - ancho, z1: D, y0, y1 }
      case 'izq': return { x0: 0, x1: ancho, z0: it.s, z1: it.s + ancho, y0, y1 }
      case 'der': return { x0: W - ancho, x1: W, z0: it.s, z1: it.s + ancho, y0, y1 }
    }
  }
  const { cx, cz, rot } = transformar(it, esc)
  const girado = Math.abs(Math.round(rot / 90)) % 2 === 1
  const hx = (girado ? prof : ancho) / 2, hz = (girado ? ancho : prof) / 2
  return { x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, y0, y1 }
}

const EPS = 0.5
function solapan(a: Caja, b: Caja) {
  return a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS && a.z0 < b.z1 - EPS && b.z0 < a.z1 - EPS && a.y0 < b.y1 - EPS && b.y0 < a.y1 - EPS
}

/** Pares que no deberían chocar entre sí (empotrables sobre/bajo mesada, campana sobre anafe...). */
function ignorarChoque(a: Item, b: Item) {
  // La decoración se apoya sobre / al lado de cualquier cosa: no se valida.
  if (a.deco || b.deco) return true
  if (a.grupo && a.grupo === b.grupo) return false
  const na = nivel(a), nb = nivel(b)
  // Solo lo que va dentro o encima de un mueble: un lavavajillas integrable ocupa su propio lugar.
  const empotra = (x: Item) => !!x.electro && (
    ['anafe', 'bacha', 'horno'].includes(x.electro.tipo) ||
    (x.electro.empotrable && ['microondas', 'campana'].includes(x.electro.tipo))
  )
  if ((na === 'mesada' && b.modulo) || (nb === 'mesada' && a.modulo)) return true
  if ((empotra(a) && b.modulo) || (empotra(b) && a.modulo)) return true
  return false
}

export interface Conflicto { a: string; b: string; texto: string }

export function conflictos(esc: Escena): Conflicto[] {
  const out: Conflicto[] = []
  const cajas = esc.items.map(it => caja(it, esc))
  const W = esc.ambiente.ancho, D = esc.ambiente.largo, H = esc.ambiente.alto
  esc.items.forEach((it, i) => {
    const c = cajas[i]
    if (c.x0 < -EPS || c.z0 < -EPS || c.x1 > W + EPS || c.z1 > D + EPS || c.y1 > H + EPS) {
      out.push({ a: it.id, b: '', texto: `${it.nombre} se sale del ambiente` })
    }
    for (let j = i + 1; j < esc.items.length; j++) {
      const o = esc.items[j]
      if (ignorarChoque(it, o)) continue
      if (solapan(c, cajas[j])) out.push({ a: it.id, b: o.id, texto: `${it.nombre} choca con ${o.nombre}` })
    }
    // Aberturas: nada puede tapar una puerta o una ventana, tampoco un mueble de la
    // pared vecina que llega hasta la esquina. Sí puede ir un bajo debajo de una ventana.
    if (!it.deco) {
      for (const ab of esc.ambiente.aberturas) {
        if (!esc.ambiente.paredes[ab.pared]) continue
        if (solapan(c, cajaAbertura(ab, W, D))) {
          out.push({ a: it.id, b: '', texto: `${it.nombre} tapa ${ab.tipo === 'puerta' ? 'la puerta' : 'la ventana'}` })
        }
      }
    }
    // Esquinas ciegas e islas pegadas: algo de otra pared delante del frente de un mueble.
    if (it.modulo && it.ubicacion !== 'libre' && !esEsquinero(it)) {
      const frente = zonaFrente(it, esc)
      esc.items.forEach((o, j) => {
        if (j === i || o.deco || o.ubicacion === it.ubicacion) return
        if (o.electro && ['anafe', 'bacha', 'campana', 'microondas'].includes(o.electro.tipo)) return
        const co = cajas[j]
        if (!solapan(frente, co)) return
        const alLargo = it.ubicacion === 'fondo' || it.ubicacion === 'frente'
        const cm = Math.round(alLargo ? Math.min(frente.x1, co.x1) - Math.max(frente.x0, co.x0) : Math.min(frente.z1, co.z1) - Math.max(frente.z0, co.z0))
        if (cm < 3) return
        out.push({
          a: it.id, b: o.id,
          texto: o.ubicacion === 'libre'
            ? `${o.nombre} queda a menos de ${DESPEJE_FRENTE} cm del frente de ${it.nombre}`
            : `${o.nombre} tapa ${cm} cm del frente de ${it.nombre} (esquina ciega): conviene un esquinero`,
        })
      })
    }
  })
  return out
}

/** Espacio mínimo libre delante de un mueble para poder abrirlo (cm). */
export const DESPEJE_FRENTE = 35

function cajaAbertura(ab: Abertura, W: number, D: number): Caja {
  const g = 6 // cm hacia adentro del ambiente
  const y0 = ab.elevacion, y1 = ab.elevacion + ab.alto
  switch (ab.pared) {
    case 'fondo': return { x0: ab.s, x1: ab.s + ab.ancho, z0: 0, z1: g, y0, y1 }
    case 'frente': return { x0: ab.s, x1: ab.s + ab.ancho, z0: D - g, z1: D, y0, y1 }
    case 'izq': return { x0: 0, x1: g, z0: ab.s, z1: ab.s + ab.ancho, y0, y1 }
    case 'der': return { x0: W - g, x1: W, z0: ab.s, z1: ab.s + ab.ancho, y0, y1 }
  }
}

/** Franja de DESPEJE_FRENTE cm delante del frente de un mueble de pared. */
function zonaFrente(it: Item, esc: ConAmbiente): Caja {
  const c = caja(it, esc)
  const f = DESPEJE_FRENTE
  switch (it.ubicacion) {
    case 'fondo': return { ...c, z0: c.z1, z1: c.z1 + f }
    case 'frente': return { ...c, z1: c.z0, z0: c.z0 - f }
    case 'izq': return { ...c, x0: c.x1, x1: c.x1 + f }
    default: return { ...c, x1: c.x0, x0: c.x0 - f }
  }
}

/**
 * Completa una escena guardada con los valores por defecto que le falten
 * (proyectos viejos, o JSON incompleto) y descarta ítems sin definición.
 */
export function normalizarEscena(e: Partial<Escena> | null | undefined): Escena {
  const b = escenaInicial()
  if (!e || typeof e !== 'object') return b
  const num = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? v : d)
  return {
    version: 1,
    ambiente: {
      ancho: num(e.ambiente?.ancho, b.ambiente.ancho),
      largo: num(e.ambiente?.largo, b.ambiente.largo),
      alto: num(e.ambiente?.alto, b.ambiente.alto),
      paredes: { ...b.ambiente.paredes, ...e.ambiente?.paredes },
      aberturas: Array.isArray(e.ambiente?.aberturas) ? e.ambiente!.aberturas : [],
    },
    estandares: { ...b.estandares, ...e.estandares },
    materiales: { ...b.materiales, ...e.materiales },
    tirador: { ...b.tirador, ...e.tirador },
    luces: {
      ...b.luces, ...e.luces,
      sol: { ...b.luces.sol, ...e.luces?.sol },
      techo: { ...b.luces.techo, ...e.luces?.techo },
      led: { ...b.luces.led, ...e.luces?.led },
    },
    items: (Array.isArray(e.items) ? e.items : [])
      .filter(it => it && typeof it.id === 'string' && (it.modulo || it.electro || it.deco))
      .map(it => ({ ...it, s: num(it.s, 0), elevacion: num(it.elevacion, 0) })),
  }
}

/** Presupuesto guardado → forma válida (listas, números ≥ 0, descuento 0–100). */
export function normalizarPresupuesto(p: unknown): Presupuesto {
  const b = (p && typeof p === 'object' ? p : {}) as Partial<Presupuesto>
  const num = (v: unknown, min = 0, max = 1e12) => { const n = Number(v); return isFinite(n) ? Math.min(max, Math.max(min, n)) : min }
  return {
    extras: (Array.isArray(b.extras) ? b.extras : []).slice(0, 50).map(e => ({
      id: String(e?.id ?? uid()), concepto: String(e?.concepto ?? '').slice(0, 200), cantidad: num(e?.cantidad), precioUnitario: num(e?.precioUnitario),
    })),
    mesadaPorMetro: !!b.mesadaPorMetro,
    precioMesadaMl: num(b.precioMesadaMl),
    incluirElectros: !!b.incluirElectros,
    descuentoPct: num(b.descuentoPct, 0, 100),
    tipoEnvioId: Number.isInteger(b.tipoEnvioId) ? (b.tipoEnvioId as number) : null,
    notas: typeof b.notas === 'string' ? b.notas.slice(0, 4000) : '',
    validezDias: num(b.validezDias ?? PRESUPUESTO_DEFAULT.validezDias, 1, 365),
  }
}

/** Tramos del salpicadero de una mesada, descontando ventanas y puertas que lo cruzan. */
export function tramosSalpicadero(esc: Escena, t: TramoMesada, y0: number, y1: number): [number, number][] {
  let libres: [number, number][] = [[t.s0, t.s1]]
  for (const ab of esc.ambiente.aberturas) {
    if (ab.pared !== t.ubicacion || !(ab.elevacion < y1 && y0 < ab.elevacion + ab.alto)) continue
    const a = ab.s - 2, b = ab.s + ab.ancho + 2
    libres = libres.flatMap(([p, q]) => (b <= p || a >= q ? [[p, q]] : [[p, Math.min(q, a)], [Math.max(p, b), q]]) as [number, number][])
      .filter(([p, q]) => q - p > 3)
  }
  return libres
}

// ─── Imanes al arrastrar ────────────────────────────────────────────────────

/** Intervalos ocupados sobre una pared, en la banda de altura del ítem. */
function ocupados(esc: Escena, it: Item, pared: Pared): [number, number][] {
  const W = esc.ambiente.ancho, D = esc.ambiente.largo
  const { prof } = medidas(it)
  const mia = caja(it, esc)
  const out: [number, number][] = []
  for (const o of esc.items) {
    if (o.id === it.id || (it.grupo && o.grupo === it.grupo)) continue
    if (ignorarChoque(it, o)) continue
    const c = caja(o, esc)
    if (!(c.y0 < mia.y1 - EPS && mia.y0 < c.y1 - EPS)) continue
    // ¿cae dentro de la franja de profundidad de esta pared?
    if (pared === 'fondo' && c.z0 < prof) out.push([c.x0, c.x1])
    if (pared === 'frente' && c.z1 > D - prof) out.push([c.x0, c.x1])
    if (pared === 'izq' && c.x0 < prof) out.push([c.z0, c.z1])
    if (pared === 'der' && c.x1 > W - prof) out.push([c.z0, c.z1])
  }
  return out
}

export function imantar(esc: Escena, it: Item, sDeseado: number, umbral = 6): number {
  if (it.ubicacion === 'libre') return sDeseado
  const pared = it.ubicacion
  const L = largoPared(esc, pared)
  const { ancho } = medidas(it)
  const cand = [0, L - ancho]
  for (const [a, b] of ocupados(esc, it, pared)) cand.push(b, a - ancho)
  for (const ab of esc.ambiente.aberturas) if (ab.pared === pared) cand.push(ab.s + ab.ancho, ab.s - ancho)
  let mejor = sDeseado, dist = umbral
  for (const c of cand) {
    const d = Math.abs(c - sDeseado)
    if (d < dist) { dist = d; mejor = c }
  }
  return Math.round(Math.max(0, Math.min(L - ancho, mejor)) * 10) / 10
}

/** Distancias libres a izquierda y derecha sobre la pared (para las cotas). */
export function huecos(esc: Escena, it: Item): { izq: number; der: number } | null {
  if (it.ubicacion === 'libre') return null
  const L = largoPared(esc, it.ubicacion)
  const { ancho } = medidas(it)
  let izq = it.s, der = L - (it.s + ancho)
  for (const [a, b] of ocupados(esc, it, it.ubicacion)) {
    if (b <= it.s + EPS) izq = Math.min(izq, it.s - b)
    if (a >= it.s + ancho - EPS) der = Math.min(der, a - (it.s + ancho))
  }
  return { izq: Math.round(izq * 10) / 10, der: Math.round(der * 10) / 10 }
}

/** Primer hueco libre en una pared donde entra un ancho dado (o null). */
export function primerHueco(esc: Escena, it: Item, pared: Pared): number | null {
  const L = largoPared(esc, pared)
  const prueba = { ...it, ubicacion: pared as Ubicacion, s: 0 }
  const occ = ocupados(esc, prueba, pared)
  for (const ab of esc.ambiente.aberturas) {
    if (ab.pared !== pared) continue
    const c = caja(prueba, esc)
    if (c.y0 < ab.elevacion + ab.alto && ab.elevacion < c.y1) occ.push([ab.s, ab.s + ab.ancho])
  }
  occ.sort((a, b) => a[0] - b[0])
  const { ancho } = medidas(it)
  let cursor = 0
  for (const [a, b] of occ) {
    if (a - cursor >= ancho - EPS) return cursor
    cursor = Math.max(cursor, b)
  }
  return L - cursor >= ancho - EPS ? cursor : null
}

// ─── Mesadas ────────────────────────────────────────────────────────────────

export interface TramoMesada {
  ubicacion: Ubicacion
  s0: number; s1: number      // sobre la pared
  caja?: Caja                 // para islas y esquineros (planta directa)
}

/** Agrupa los bajos contiguos de cada pared en tramos continuos de mesada. */
export function tramosMesada(esc: Escena): TramoMesada[] {
  const tramos: TramoMesada[] = []
  const lleva = (it: Item) => {
    if (it.modulo) return (it.modulo.tipo === 'bajo' && (esc.estandares.mesadaActiva || it.modulo.conMesada))
    return esc.estandares.mesadaActiva && !!it.electro && ['lavavajillas', 'lavarropas', 'horno'].includes(it.electro.tipo) && it.electro.empotrable
  }
  for (const p of ['fondo', 'izq', 'der', 'frente'] as Pared[]) {
    const iv = esc.items
      .filter(it => it.ubicacion === p && lleva(it))
      .map(it => [it.s, it.s + medidas(it).ancho] as [number, number])
      .sort((a, b) => a[0] - b[0])
    let cur: [number, number] | null = null
    for (const [a, b] of iv) {
      if (cur && a <= cur[1] + 1) cur[1] = Math.max(cur[1], b)
      else { if (cur) tramos.push({ ubicacion: p, s0: cur[0], s1: cur[1] }); cur = [a, b] }
    }
    if (cur) tramos.push({ ubicacion: p, s0: cur[0], s1: cur[1] })
  }
  for (const it of esc.items) {
    if (it.modulo?.tipo === 'esquinero-bajo' && (esc.estandares.mesadaActiva || it.modulo.conMesada)) {
      tramos.push({ ubicacion: it.ubicacion, s0: it.s, s1: it.s + it.modulo.ancho, caja: caja(it, esc) })
    } else if (it.ubicacion === 'libre' && lleva(it)) {
      tramos.push({ ubicacion: 'libre', s0: 0, s1: 0, caja: caja(it, esc) })
    }
  }
  return tramos
}

export function metrosMesada(esc: Escena): number {
  let cm = 0
  for (const t of tramosMesada(esc)) {
    if (t.caja) cm += Math.max(t.caja.x1 - t.caja.x0, t.caja.z1 - t.caja.z0) * (t.ubicacion === 'libre' ? 1 : 1.5)
    else cm += t.s1 - t.s0
  }
  return Math.round(cm) / 100
}

// ─── Autocompletar una pared con módulos del catálogo ───────────────────────

/** Mejor combinación de anchos (cm) que llena `largo` sin pasarse, con la menor cantidad de módulos. */
export function combinarAnchos(largo: number, anchos: number[]): number[] {
  const U = 5
  const n = Math.floor(largo / U)
  const opciones = [...new Set(anchos.filter(a => a % U === 0 && a <= largo))].sort((a, b) => b - a)
  const mejor: (number[] | null)[] = Array(n + 1).fill(null)
  mejor[0] = []
  for (let i = 1; i <= n; i++) {
    for (const a of opciones) {
      const k = a / U
      if (k > i || !mejor[i - k]) continue
      const cand = [...mejor[i - k]!, a]
      if (!mejor[i] || cand.length < mejor[i]!.length) mejor[i] = cand
    }
  }
  for (let i = n; i >= 0; i--) if (mejor[i]) return mejor[i]!.sort((a, b) => b - a)
  return []
}

/** Elige, para cada ancho, el producto más "neutro" (sin vidrio / micro / colores especiales). */
export function productoPorAncho(catalogo: ProductoCatalogo[], grupo: 'bajo' | 'alacena', alto?: number) {
  const mapa = new Map<number, ProductoCatalogo>()
  const puntaje = (p: ProductoCatalogo) => {
    const d = p.def!
    let s = 0
    if (d.frente) s += 5
    if (d.columnas.some(c => ['micro', 'hueco', 'vidrio', 'rebatible'].includes(c.tipo))) s += 4
    return s
  }
  for (const p of catalogo) {
    if (p.grupo !== grupo || !p.def) continue
    if (alto && p.def.alto !== alto) continue
    if (p.def.frente) continue // las líneas bicolor no se mezclan al autocompletar
    const actual = mapa.get(p.def.ancho)
    if (!actual || puntaje(p) < puntaje(actual) || (puntaje(p) === puntaje(actual) && p.precio < actual.precio)) mapa.set(p.def.ancho, p)
  }
  return mapa
}

// ─── Presupuesto ────────────────────────────────────────────────────────────

export interface LineaPresupuesto {
  clave: string
  productoId?: number
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
  tipo: 'producto' | 'electro' | 'generico' | 'deco'
  incluido: boolean
}

export function lineasPresupuesto(esc: Escena, precios: Map<number, number>, pres: Presupuesto): LineaPresupuesto[] {
  const mapa = new Map<string, LineaPresupuesto>()
  for (const it of esc.items) {
    if (!it.cuentaEnPresupuesto) continue
    const tipo = it.origen
    const clave = tipo === 'producto' ? `p${it.productoId}` : tipo === 'electro' ? `e${it.electroId ?? ''}|${it.nombre}|${it.precio}` : `g${it.nombre}|${it.precio}`
    const precio = tipo === 'producto' ? (precios.get(it.productoId!) ?? it.precio) : it.precio
    const incluido = tipo !== 'electro' || pres.incluirElectros
    const l = mapa.get(clave)
    if (l) { l.cantidad++; l.subtotal = l.cantidad * l.precio }
    else mapa.set(clave, { clave, productoId: it.productoId, nombre: it.nombre, cantidad: 1, precio, subtotal: precio, tipo, incluido })
  }
  return [...mapa.values()]
}

export function totalesPresupuesto(lineas: LineaPresupuesto[], pres: Presupuesto, metrosMesadaCalc: number, costoEnvio: number) {
  const productos = lineas.filter(l => l.incluido).reduce((a, l) => a + l.subtotal, 0)
  const mesada = pres.mesadaPorMetro ? Math.round(metrosMesadaCalc * pres.precioMesadaMl) : 0
  const extras = pres.extras.reduce((a, e) => a + e.cantidad * e.precioUnitario, 0)
  const subtotal = productos + mesada + extras
  const descuento = Math.round(subtotal * (pres.descuentoPct || 0) / 100)
  const total = Math.round(subtotal - descuento + costoEnvio)
  return { productos: Math.round(productos), mesada, extras: Math.round(extras), subtotal: Math.round(subtotal), descuento, envio: costoEnvio, total }
}
