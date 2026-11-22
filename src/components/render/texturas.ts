import * as THREE from 'three'
import type { MatDef, TexturaId } from '@/lib/render/tipos'

// Texturas procedurales dibujadas en canvas (sin descargar nada: la CSP del
// sitio no permite orígenes externos y así no dependemos de licencias de
// imágenes). Cada textura es "tileable" y cubre `MatDef.escala` metros; las
// geometrías tienen UVs en metros, así que la escala es real en todo el ambiente.

const TAM = 512
type RGB = [number, number, number]

const hexARgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** f < 1 oscurece, f > 1 aclara hacia blanco. */
const tono = (c: RGB, f: number): RGB =>
  c.map(v => (f <= 1 ? v * Math.max(0, f) : v + (255 - v) * Math.min(1, f - 1))) as RGB

const css = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`

function azar(semilla: number) {
  let s = semilla % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Ruido de valor tileable con fbm. Devuelve una función (x, y) en píxeles → 0..1. */
function ruido(semilla: number, celdas: number, octavas = 4) {
  const r = azar(semilla)
  const capas: { n: number; g: Float32Array }[] = []
  for (let o = 0; o < octavas; o++) {
    const n = celdas * 2 ** o
    const g = new Float32Array(n * n)
    for (let i = 0; i < g.length; i++) g[i] = r()
    capas.push({ n, g })
  }
  const suave = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    let v = 0, amp = 1, tot = 0
    for (const { n, g } of capas) {
      const fx = (x / TAM) * n, fy = (y / TAM) * n
      const x0 = Math.floor(fx), y0 = Math.floor(fy)
      const tx = suave(fx - x0), ty = suave(fy - y0)
      const at = (i: number, j: number) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)]
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1)
      v += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty)
      tot += amp
      amp *= 0.5
    }
    return v / tot
  }
}

function porPixel(ctx: CanvasRenderingContext2D, base: RGB, f: (x: number, y: number) => number) {
  const img = ctx.createImageData(TAM, TAM)
  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      const c = tono(base, f(x, y))
      const i = (y * TAM + x) * 4
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function grano(ctx: CanvasRenderingContext2D, intensidad: number, semilla = 7) {
  const r = azar(semilla)
  const img = ctx.getImageData(0, 0, TAM, TAM)
  for (let i = 0; i < img.data.length; i += 4) {
    const d = (r() - 0.5) * intensidad
    img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d
  }
  ctx.putImageData(img, 0, 0)
}

function madera(ctx: CanvasRenderingContext2D, base: RGB, contraste: number, semilla: number, poros = false) {
  // Veta vertical larga: el ruido varía lento a lo largo (y) y rápido a lo ancho (x).
  const lento = ruido(semilla, 3, 4)
  const fino = ruido(semilla + 11, 96, 2)
  const anillos = 14
  porPixel(ctx, base, (x, y) => {
    const w = (lento(x * 0.5, y * 0.35) - 0.5) * 1.1
    const v = Math.sin(((x / TAM) * anillos + w) * Math.PI * 2)
    const veta = Math.pow(0.5 + 0.5 * v, 2.2)
    const hebra = fino(x * 2.5, y * 0.08) - 0.5
    let f = 1 - contraste * 0.35 + veta * contraste * 0.45 + hebra * 0.1
    if (poros && fino(x * 5, y * 0.25) > 0.8) f -= 0.08
    return f
  })
}

function tablero(ctx: CanvasRenderingContext2D, base: RGB, cols: number, filas: number, junta: number, colorJunta: RGB, semilla: number,
  desfase = 0, variacion = 0.06, dibujar?: (x: number, y: number, w: number, h: number, c: RGB) => void) {
  const r = azar(semilla)
  ctx.fillStyle = css(colorJunta)
  ctx.fillRect(0, 0, TAM, TAM)
  const w = TAM / cols, h = TAM / filas
  for (let j = 0; j < filas; j++) {
    const off = (j % 2) * desfase * w
    for (let i = -1; i <= cols; i++) {
      const c = tono(base, 1 + (r() - 0.5) * variacion * 2)
      const x = i * w + off
      if (dibujar) dibujar(x + junta / 2, j * h + junta / 2, w - junta, h - junta, c)
      else { ctx.fillStyle = css(c); ctx.fillRect(x + junta / 2, j * h + junta / 2, w - junta, h - junta) }
    }
  }
}

const GENERADORES: Record<TexturaId, (ctx: CanvasRenderingContext2D, base: RGB) => void> = {
  liso: (ctx, base) => { ctx.fillStyle = css(base); ctx.fillRect(0, 0, TAM, TAM); grano(ctx, 3) },
  lino: (ctx, base) => {
    const n = ruido(5, 128, 2)
    porPixel(ctx, base, (x, y) => 0.96 + (n(x, y * 0.05) - 0.5) * 0.08 + (n(x * 0.05, y) - 0.5) * 0.08)
  },
  'madera-clara': (ctx, base) => madera(ctx, base, 0.2, 3),
  'madera-media': (ctx, base) => madera(ctx, base, 0.26, 13),
  'madera-oscura': (ctx, base) => madera(ctx, base, 0.3, 23),
  roble: (ctx, base) => madera(ctx, base, 0.26, 31, true),
  marmol: (ctx, base) => {
    const n = ruido(41, 3, 6)
    porPixel(ctx, base, (x, y) => {
      const v = Math.abs(Math.sin(((x + y) / TAM) * Math.PI * 2 * 2 + n(x, y) * 9))
      const veta = Math.pow(1 - v, 14) * 0.55 + Math.pow(1 - v, 3) * 0.06
      return 1 - veta + (n(x * 4, y * 4) - 0.5) * 0.05
    })
  },
  granito: (ctx, base) => {
    const n = ruido(51, 96, 3), m = ruido(52, 48, 2)
    porPixel(ctx, base, (x, y) => {
      const a = n(x, y), b = m(x, y)
      if (a > 0.72) return 0.35 + b * 0.2
      if (a < 0.24) return 1.45
      return 0.88 + b * 0.22
    })
  },
  'granito-oscuro': (ctx, base) => {
    const n = ruido(61, 128, 3), m = ruido(62, 32, 2)
    porPixel(ctx, base, (x, y) => {
      const a = n(x, y)
      if (a > 0.76) return 1.12
      return 0.85 + m(x, y) * 0.25
    })
  },
  hormigon: (ctx, base) => {
    const n = ruido(71, 6, 6), m = ruido(72, 160, 2)
    porPixel(ctx, base, (x, y) => 0.9 + (n(x, y) - 0.5) * 0.28 + (m(x, y) - 0.5) * 0.08)
  },
  porcellanato: (ctx, base) => {
    tablero(ctx, base, 2, 2, 3, tono(base, 0.82), 81, 0, 0.03)
    const n = ruido(82, 8, 5)
    const img = ctx.getImageData(0, 0, TAM, TAM)
    for (let i = 0; i < img.data.length; i += 4) {
      const p = i / 4, d = (n(p % TAM, Math.floor(p / TAM)) - 0.5) * 22
      img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d
    }
    ctx.putImageData(img, 0, 0)
  },
  ceramico: (ctx, base) => { tablero(ctx, base, 2, 2, 6, [205, 200, 192], 91, 0, 0.05); grano(ctx, 8) },
  subway: (ctx, base) => {
    tablero(ctx, base, 2, 4, 5, [225, 224, 220], 101, 0.5, 0.035, (x, y, w, h, c) => {
      const g = ctx.createLinearGradient(x, y, x, y + h)
      g.addColorStop(0, css(tono(c, 1.06))); g.addColorStop(0.5, css(c)); g.addColorStop(1, css(tono(c, 0.93)))
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
    })
  },
  damero: (ctx, base) => {
    const negro: RGB = [32, 32, 34]
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      ctx.fillStyle = css((i + j) % 2 ? negro : base); ctx.fillRect(i * TAM / 2, j * TAM / 2, TAM / 2, TAM / 2)
    }
    ctx.strokeStyle = 'rgba(120,120,120,0.6)'; ctx.lineWidth = 3
    for (let k = 0; k <= 2; k++) {
      ctx.beginPath(); ctx.moveTo(k * TAM / 2, 0); ctx.lineTo(k * TAM / 2, TAM); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, k * TAM / 2); ctx.lineTo(TAM, k * TAM / 2); ctx.stroke()
    }
    grano(ctx, 6)
  },
  parquet: (ctx, base) => {
    const cols = 8, w = TAM / cols
    const r = azar(111)
    const n = ruido(112, 4, 4)
    const img = ctx.createImageData(TAM, TAM)
    const cortes: number[][] = Array.from({ length: cols }, () => { const o = r() * TAM; return [o, (o + TAM / 2) % TAM] })
    const tonos = Array.from({ length: cols * 3 }, () => 0.88 + r() * 0.22)
    for (let y = 0; y < TAM; y++) for (let x = 0; x < TAM; x++) {
      const c = Math.floor(x / w)
      const [a, b] = cortes[c]
      const tramo = (y >= Math.min(a, b) && y < Math.max(a, b)) ? 1 : 0
      const junta = x % w < 2 || Math.abs(y - a) < 1.5 || Math.abs(y - b) < 1.5
      const veta = Math.sin(((x % w) / w * 3 + n(x * 2, y * 0.3) * 2) * Math.PI) * 0.06
      const f = junta ? 0.55 : tonos[c * 2 + tramo] + veta
      const col = tono(base, f)
      const i = (y * TAM + x) * 4
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  },
  espiga: (ctx, base) => {
    const w = TAM / 8, L = w * 4
    const r = azar(121)
    const n = ruido(122, 8, 3)
    const tonos = Array.from({ length: 512 }, () => 0.86 + r() * 0.24)
    porPixel(ctx, base, (x, y) => {
      const c = Math.floor(x / w), lx = x % w
      const yy = y + (c % 2 === 0 ? lx : w - lx)
      const k = Math.floor(yy / L)
      const junta = lx < 1.5 || (yy % L) < 2
      return junta ? 0.55 : tonos[(c * 31 + k * 7) & 511] + (n(x, y) - 0.5) * 0.1
    })
  },
  ladrillo: (ctx, base) => { tablero(ctx, base, 4, 14, 6, [200, 194, 182], 131, 0.5, 0.12); grano(ctx, 18) },
  hexagonal: (ctx, base) => {
    ctx.fillStyle = 'rgb(205,203,198)'; ctx.fillRect(0, 0, TAM, TAM)
    const r = azar(141)
    const R = TAM / 8 / Math.sqrt(3) * 2 / 2 * 1.0
    const dx = Math.sqrt(3) * R, dy = 1.5 * R
    for (let j = -1; j * dy < TAM + dy; j++) for (let i = -1; i * dx < TAM + dx; i++) {
      const cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 3 * k + Math.PI / 6
        ctx.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2))
      }
      ctx.closePath(); ctx.fillStyle = css(tono(base, 0.94 + r() * 0.1)); ctx.fill()
    }
  },
}

/** Si la textura dibuja juntas, se usa también como relieve (bump). */
const CON_RELIEVE: TexturaId[] = ['porcellanato', 'ceramico', 'subway', 'damero', 'parquet', 'espiga', 'ladrillo', 'hexagonal', 'roble']

const cacheTex = new Map<string, THREE.Texture>()
const cacheImg = new Map<string, THREE.Texture>()
const cacheMat = new Map<string, THREE.MeshStandardMaterial>()

/** El Canvas dibuja a demanda: se avisa cuando una imagen termina de cargar. */
export const alCargarTextura: { fn: (() => void) | null } = { fn: null }

/**
 * Las cachés se acotan (al arrastrar un selector de color se genera una
 * entrada por cada tono intermedio). Liberar algo que todavía se usa es
 * seguro: three lo vuelve a subir a la GPU en el próximo cuadro.
 */
function acotar<T extends { dispose(): void }>(cache: Map<string, T>, max: number) {
  while (cache.size > max) {
    const [clave, valor] = cache.entries().next().value as [string, T]
    cache.delete(clave)
    valor.dispose()
  }
}
let anisotropia = 8
export function fijarAnisotropia(n: number) { anisotropia = n }

function texturaCanvas(id: TexturaId, color: string): THREE.Texture {
  const clave = `${id}|${color}`
  const hit = cacheTex.get(clave)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TAM
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ;(GENERADORES[id] ?? GENERADORES.liso)(ctx, hexARgb(color))
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = anisotropia
  cacheTex.set(clave, tex)
  acotar(cacheTex, 80)
  return tex
}

function texturaImagen(url: string): THREE.Texture {
  const hit = cacheImg.get(url)
  if (hit) return hit
  const tex = new THREE.TextureLoader().load(url, () => alCargarTextura.fn?.())
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = anisotropia
  cacheImg.set(url, tex)
  return tex
}

/**
 * Material compartido para una definición. Se cachea por clave: dos muebles
 * con el mismo acabado usan el mismo material (y la misma textura en GPU).
 */
export function material(def: MatDef, sombraDoble = false): THREE.MeshStandardMaterial {
  const clave = `${def.textura}|${def.color}|${def.imagen ?? ''}|${def.escala}|${def.rugosidad}|${def.metalico}|${sombraDoble ? 1 : 0}`
  const hit = cacheMat.get(clave)
  if (hit) return hit
  const mat = new THREE.MeshStandardMaterial({ roughness: def.rugosidad, metalness: def.metalico })
  if (!def.imagen && def.textura === 'liso') {
    // Color pleno: sin textura (no hace falta generar un canvas por cada tono).
    mat.color.set(def.color)
  } else {
    const base = def.imagen ? texturaImagen(def.imagen) : texturaCanvas(def.textura, def.color)
    const map = base.clone()
    map.needsUpdate = true
    const rep = 1 / Math.max(0.05, def.escala)
    map.repeat.set(rep, rep)
    mat.map = map
    if (!def.imagen && CON_RELIEVE.includes(def.textura)) {
      mat.bumpMap = map
      mat.bumpScale = def.textura === 'roble' ? 0.6 : 2.2
    }
  }
  // Paredes y techo son planos de una cara: igual tienen que proyectar sombra.
  if (sombraDoble) mat.shadowSide = THREE.DoubleSide
  cacheMat.set(clave, mat)
  while (cacheMat.size > 120) {
    const [k, m] = cacheMat.entries().next().value as [string, THREE.MeshStandardMaterial]
    cacheMat.delete(k)
    m.map?.dispose()
    m.dispose()
  }
  return mat
}

/** Muestra de la textura para los selectores del panel (data URL chica). */
export function miniatura(def: MatDef, tam = 64): string {
  if (def.imagen) return def.imagen
  if (def.textura === 'liso') {
    const c = document.createElement('canvas')
    c.width = c.height = 8
    const ctx = c.getContext('2d')!
    ctx.fillStyle = def.color
    ctx.fillRect(0, 0, 8, 8)
    return c.toDataURL()
  }
  const tex = texturaCanvas(def.textura, def.color)
  const src = tex.image as HTMLCanvasElement
  const c = document.createElement('canvas')
  c.width = c.height = tam
  c.getContext('2d')!.drawImage(src, 0, 0, tam, tam)
  return c.toDataURL()
}

// Materiales fijos (vidrio, metales, negros de electro).
const fijo = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)
export const MAT = {
  vidrio: new THREE.MeshStandardMaterial({ color: '#cfe0e2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }),
  vidrioOscuro: fijo({ color: '#141518', roughness: 0.08, metalness: 0.3 }),
  inox: fijo({ color: '#c9ccd0', roughness: 0.32, metalness: 0.88 }),
  inoxCepillado: fijo({ color: '#b8bbbf', roughness: 0.45, metalness: 0.8 }),
  blanco: fijo({ color: '#f1f1ef', roughness: 0.35, metalness: 0.05 }),
  negro: fijo({ color: '#1c1c1e', roughness: 0.3, metalness: 0.2 }),
  gris: fijo({ color: '#6b6e72', roughness: 0.35, metalness: 0.5 }),
  goma: fijo({ color: '#222', roughness: 0.9 }),
  hierro: fijo({ color: '#202022', roughness: 0.6, metalness: 0.6 }),
  interior: fijo({ color: '#3a3a3a', roughness: 0.9 }),
  agua: fijo({ color: '#9aa3a8', roughness: 0.2, metalness: 0.7 }),
}

export function matAcabado(acabado: string) {
  if (acabado === 'blanco') return MAT.blanco
  if (acabado === 'negro') return MAT.negro
  if (acabado === 'gris') return MAT.gris
  return MAT.inox
}

const cacheColor = new Map<string, THREE.MeshStandardMaterial>()
export function matColor(color: string, rugosidad = 0.4, metalico = 0) {
  const k = `${color}|${rugosidad}|${metalico}`
  let m = cacheColor.get(k)
  if (!m) { m = fijo({ color, roughness: rugosidad, metalness: metalico }); cacheColor.set(k, m) }
  return m
}

// ─── Cuadros ────────────────────────────────────────────────────────────────

const PALETAS: string[][] = [
  ['#c0272d', '#1e1e1e', '#e9dfcf', '#b9895a'],
  ['#2f4b56', '#7f9c8a', '#e4d9c6', '#c9a77e'],
  ['#d97b4a', '#f2c46d', '#3e5c50', '#efe9df'],
  ['#1e1e1e', '#8d8f8e', '#d9d8d4', '#c0272d'],
  ['#6f7552', '#b7c2ae', '#e8e4dc', '#4a3426'],
]

const cacheArte = new Map<string, THREE.Texture>()

/** Arte abstracto generado por semilla (formas, bandas o círculos). */
export function texturaArte(variante: number, fondo: string): THREE.Texture {
  const k = `${variante}|${fondo}`
  const hit = cacheArte.get(k)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const r = azar(variante * 7919 + 13)
  const pal = PALETAS[variante % PALETAS.length]
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, 512, 512)
  const estilo = variante % 3
  if (estilo === 0) {
    // composición de bloques
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = pal[Math.floor(r() * pal.length)]
      ctx.globalAlpha = 0.75 + r() * 0.25
      ctx.fillRect(r() * 400, r() * 400, 60 + r() * 220, 60 + r() * 220)
    }
  } else if (estilo === 1) {
    // círculos y arcos
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = pal[i % pal.length]
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.arc(80 + r() * 350, 80 + r() * 350, 40 + r() * 140, r() * Math.PI, r() * Math.PI + Math.PI * (0.8 + r()))
      ctx.fill()
    }
  } else {
    // paisaje en bandas
    let y = 0
    for (let i = 0; i < 5; i++) {
      const h = 60 + r() * 120
      ctx.fillStyle = pal[i % pal.length]
      ctx.beginPath()
      ctx.moveTo(0, y + h)
      for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, y + h - Math.sin(x / 80 + r() * 2) * 25)
      ctx.lineTo(512, 512); ctx.lineTo(0, 512); ctx.closePath(); ctx.fill()
      y += h * 0.7
    }
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  cacheArte.set(k, tex)
  return tex
}

/** Foto subida por el admin (sin repetir). */
export function texturaFoto(url: string): THREE.Texture {
  const k = `foto|${url}`
  const hit = cacheArte.get(k)
  if (hit) return hit
  const tex = new THREE.TextureLoader().load(url, () => alCargarTextura.fn?.())
  tex.colorSpace = THREE.SRGBColorSpace
  cacheArte.set(k, tex)
  return tex
}
