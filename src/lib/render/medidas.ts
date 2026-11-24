import type { Columna, DefCombo, DefModulo, ProductoCatalogo, TipoModulo } from './tipos'
import { coloresDesdeNombre } from './materiales'
import { FICHAS, FICHAS_COMBO } from './disenos'

// Deduce cómo dibujar un producto del catálogo a partir de su nombre
// ("Alacena 80 x 60 portamicroondas", "Bajo mesada 1,20 con cajonera"...) y,
// si existe, del renglón "Medidas: Ancho: ..., Alto: ..., Profundidad: ..." de
// datosUtiles. Las medidas que no figuran salen de los estándares de la fábrica
// y se pueden corregir por producto desde el editor (RenderModulo).

export const ESTANDAR = {
  altoBajo: 85,      // incluye zócalo, sin mesada
  profBajo: 58,
  altoAlacena: 60,
  profAlacena: 30,
  profAlto: 40,
}

const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

/** "1,20" → 120 · "1 mt" → 100 · "90" → 90 · "0,40" → 40 */
function aCm(valor: string, unidad?: string): number {
  const n = parseFloat(valor.replace(',', '.'))
  if (!isFinite(n)) return NaN
  const u = (unidad ?? '').toLowerCase()
  if (u.startsWith('m') && !u.startsWith('mm')) return Math.round(n * 100)
  if (n < 5) return Math.round(n * 100)   // "1,20", "1.40", "0,80" son metros
  return Math.round(n)
}

// La unidad es opcional y no puede ser el comienzo de otra palabra ("60 mesada"); sí puede
// seguir una "x" pegada ("80x60").
const NUM = String.raw`(\d+(?:[.,]\d+)?)\s*(mts?|m|cm)?(?![a-wyz0-9])`

function medidasExplicitas(texto: string) {
  const t = normalizar(texto)
  const leer = (clave: string) => {
    const r = new RegExp(`${clave}\\s*:?\\s*${NUM}`).exec(t)
    return r ? aCm(r[1], r[2] ?? 'cm') : undefined
  }
  const ancho = leer('ancho'), alto = leer('alto'), profundidad = leer('profundidad')
  return { ancho, alto, profundidad }
}

function medidasConEtiqueta(nombre: string) {
  // "1,80 alto x 0,80 ancho x 0,40 profundidad"
  const t = normalizar(nombre)
  const r: Record<string, number> = {}
  for (const m of t.matchAll(new RegExp(`${NUM}\\s*(alto|ancho|profundidad)`, 'g'))) r[m[3]] = aCm(m[1], m[2])
  return r
}

function par(nombre: string): [number, number] | null {
  const r = new RegExp(`${NUM}\\s*x\\s*${NUM}`).exec(normalizar(nombre))
  return r ? [aCm(r[1], r[2]), aCm(r[3], r[4])] : null
}

/** Primer número que es una medida: se saltean cantidades ("2 puertas", "3 cajones"). */
function primerNumero(nombre: string): number | null {
  const t = normalizar(nombre)
  for (const m of t.matchAll(new RegExp(NUM, 'g'))) {
    const resto = t.slice(m.index! + m[0].length)
    if (!m[2] && /^\s*(puertas?|cajon(es)?|hornallas?|estantes?|hojas?|macetas?)\b/.test(resto)) continue
    return aCm(m[1], m[2])
  }
  return null
}

function contarPuertas(n: string): number | null {
  if (/\b(una|1) puerta\b/.test(n)) return 1
  if (/\b(dos|2) puertas\b/.test(n)) return 2
  if (/\b(tres|3) puertas\b/.test(n)) return 3
  if (/\b(cuatro|4) puertas\b/.test(n)) return 4
  return null
}

export function columnasPara(nombre: string, tipo: TipoModulo, ancho: number): Columna[] {
  const n = normalizar(nombre)
  const puerta: Columna['tipo'] = /vidri/.test(n) ? 'vidrio' : 'puerta'
  const puertas = contarPuertas(n)
  const porAncho = (a: number) => (a <= 50 ? 1 : a <= 100 ? 2 : 3)

  if (tipo.startsWith('esquinero')) return [{ tipo: puerta }]
  if (/ajuste|especiero/.test(n) || ancho <= 20) return [{ tipo: 'bandejero' }]
  if (/bandejero/.test(n)) return [{ tipo: 'bandejero', ancho: 15 }, ...Array(porAncho(ancho - 15)).fill({ tipo: puerta })]

  if (/cajon/.test(n) && tipo === 'bajo') {
    if (ancho <= 60) return [{ tipo: 'cajones', cajones: ancho <= 45 ? 4 : 3 }]
    const resto = ancho - 40
    return [...Array(puertas ?? (resto <= 60 ? 1 : 2)).fill({ tipo: puerta }), { tipo: 'cajones', ancho: 40, cajones: 3 }]
  }

  if (/microondas/.test(n)) {
    if (ancho <= 60) return [{ tipo: 'micro' }]
    const resto = ancho - 60
    return [{ tipo: 'micro', ancho: 60 }, ...Array(resto <= 50 ? 1 : 2).fill({ tipo: puerta })]
  }

  if (/rebatible/.test(n)) {
    if (/hueco/.test(n)) return [{ tipo: 'micro' }]
    return [{ tipo: 'rebatible' }]
  }

  if (/hueco|estante abierto/.test(n)) {
    if (ancho <= 50) return [{ tipo: 'micro' }]
    const lados = ancho > 140 ? 2 : 1
    return [
      ...Array(lados).fill({ tipo: puerta }),
      { tipo: 'hueco', ancho: Math.min(40, Math.round(ancho / 3)) },
      ...Array(lados).fill({ tipo: puerta }),
    ]
  }

  const k = puertas ?? porAncho(ancho)
  return Array(k).fill({ tipo: puerta })
}

function modulo(nombre: string, tipo: TipoModulo, ancho: number, alto: number, profundidad: number): DefModulo {
  const colores = coloresDesdeNombre(nombre)
  return { tipo, ancho, alto, profundidad, columnas: columnasPara(nombre, tipo, ancho), ...colores }
}

export type Grupo = ProductoCatalogo['grupo']

/**
 * Detalles constructivos comunes a las líneas de fábrica, para los productos que
 * todavía no tienen ficha relevada (disenos.ts): manija barra negra horizontal y
 * patas cromadas en la línea blanca, uñero y patas de aluminio en la línea de color,
 * arco cromado y patas negras en despenseros.
 */
export function detallesDeLinea(def: DefModulo): DefModulo {
  const color = !!def.frente
  const bajo = def.tipo === 'bajo' || def.tipo === 'esquinero-bajo'
  if (def.tipo === 'alto') return { tirador: 'arco-cromo', patas: 'negra', ...def }
  if (color) return { tirador: 'unero', embutido: true, ...(bajo ? { patas: 'aluminio' as const, travesano: true } : {}), ...def }
  return { tirador: 'barra-negra', ...(bajo ? { patas: 'cromo' as const, travesano: true } : {}), ...def }
}

/** Resultado de interpretar un producto: un módulo simple, un combo, o nada. */
export function deducirProducto(
  nombre: string,
  datosUtiles?: string | null,
  productoId?: number,
): { grupo: Grupo; def: DefModulo | null; combo: DefCombo | null } {
  const r = deducirDelNombre(nombre, datosUtiles)
  const ficha = productoId ? FICHAS[productoId] : undefined
  const fichaCombo = productoId ? FICHAS_COMBO[productoId] : undefined
  if (r.def) r.def = ficha ? { ...r.def, ...ficha, ficha: true } : detallesDeLinea(r.def)
  if (r.combo) {
    if (fichaCombo) {
      const colores = coloresDesdeNombre(nombre)
      const c = fichaCombo(ESTANDAR.altoBajo, ESTANDAR.altoAlacena)
      r.combo = { ...c, componentes: c.componentes.map(x => ({ ...colores, ...x })) }
    } else {
      r.combo = { componentes: r.combo.componentes.map(detallesDeLinea) }
    }
  }
  return r
}

function deducirDelNombre(
  nombre: string,
  datosUtiles?: string | null,
): { grupo: Grupo; def: DefModulo | null; combo: DefCombo | null } {
  const n = normalizar(nombre)
  const expl = medidasExplicitas(datosUtiles ?? '')

  // Combos: "Combo 1,20 (Bajo mesada, alacena...)" / "Bajo Mesada 1,60 Mt Y Alacena 3 Mt"
  // Combo: empieza con "combo" o nombra un bajo mesada y una alacena juntos.
  if (n.startsWith('combo') || /bajo mesada.+\b(y|mas|con)\b.+alacena|bajo mesada.+\+.+alacena/.test(n)) {
    const rBajo = new RegExp(`bajo mesada\\s*${NUM}`).exec(n)
    const rAlac = new RegExp(`alacena\\s*${NUM}`).exec(n)
    const base = primerNumero(n.replace(/^combo\s*/, '')) ?? 100
    const anchoBajo = rBajo ? aCm(rBajo[1], rBajo[2]) : base
    const anchoAlac = rAlac ? aCm(rAlac[1], rAlac[2]) : base
    const componentes: DefModulo[] = []
    componentes.push(modulo(nombre.replace(/cajon\w*/gi, ''), 'bajo', anchoBajo, ESTANDAR.altoBajo, ESTANDAR.profBajo))
    // Alacenas largas se parten en tramos de hasta 120 cm.
    let restante = anchoAlac
    while (restante > 0) {
      const tramo = restante > 120 ? Math.min(100, restante - 40) : restante
      componentes.push(modulo('Alacena', 'alacena', tramo, ESTANDAR.altoAlacena, ESTANDAR.profAlacena))
      restante -= tramo
    }
    const colores = coloresDesdeNombre(nombre)
    for (const c of componentes) Object.assign(c, colores)
    if (/granito|mesada de/.test(n)) componentes[0].conMesada = true
    return { grupo: 'combo', def: null, combo: { componentes } }
  }

  const etiq = medidasConEtiqueta(nombre)

  if (/esquiner/.test(n)) {
    const esBajo = /bajo/.test(n)
    const ancho = expl.ancho ?? primerNumero(n) ?? 90
    const tipo: TipoModulo = esBajo ? 'esquinero-bajo' : 'esquinero-alto'
    const alto = esBajo ? ESTANDAR.altoBajo : (par(n)?.[1] ?? ESTANDAR.altoAlacena)
    return { grupo: 'esquinero', def: modulo(nombre, tipo, ancho, alto, esBajo ? ESTANDAR.profBajo : ESTANDAR.profAlacena), combo: null }
  }

  if (n.startsWith('bajo mesada')) {
    const ancho = expl.ancho ?? primerNumero(n.replace('bajo mesada', '')) ?? 60
    const grupo: Grupo = /ajuste/.test(n) ? 'ajuste' : 'bajo'
    return { grupo, def: modulo(nombre, 'bajo', ancho, expl.alto ?? ESTANDAR.altoBajo, expl.profundidad ?? ESTANDAR.profBajo), combo: null }
  }

  if (/^(despensero|organizador)/.test(n)) {
    const p = par(n)
    let alto = etiq.alto ?? (p ? Math.max(p[0], p[1]) : 180)
    let ancho = etiq.ancho ?? (p ? Math.min(p[0], p[1]) : 60)
    const profundidad = etiq.profundidad ?? expl.profundidad ?? ESTANDAR.profAlto
    if (expl.alto) alto = expl.alto
    if (expl.ancho) ancho = expl.ancho
    return { grupo: 'alto', def: modulo(nombre, 'alto', ancho, alto, profundidad), combo: null }
  }

  if (/^(alacena|especiero)/.test(n)) {
    const p = par(n)
    const ancho = expl.ancho ?? p?.[0] ?? primerNumero(n) ?? 60
    const alto = expl.alto ?? p?.[1] ?? ESTANDAR.altoAlacena
    const grupo: Grupo = /especiero|ajuste/.test(n) ? 'ajuste' : 'alacena'
    return { grupo, def: modulo(nombre, 'alacena', ancho, alto, expl.profundidad ?? ESTANDAR.profAlacena), combo: null }
  }

  return { grupo: 'bajo', def: null, combo: null }
}
