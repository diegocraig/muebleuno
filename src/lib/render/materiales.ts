import type { MatDef, GrupoMaterial, TexturaId } from './tipos'

// Biblioteca de materiales. Los colores de melamina son aproximaciones de las
// placas que usa la fábrica: Paraíso, Jade y Gris basalto se calibraron con las
// fotos del catálogo (nov 2026). Se pueden afinar desde el panel de Materiales.

const m = (nombre: string, color: string, textura: TexturaId, escala = 0.6, rugosidad = 0.6, metalico = 0): MatDef =>
  ({ nombre, color, textura, escala, rugosidad, metalico })

export const MATERIALES_PRESET: Record<string, MatDef> = {
  // Melaminas lisas
  blanco: m('Blanco', '#f2f1ec', 'liso', 1, 0.45),
  'blanco-brillo': m('Blanco alto brillo', '#f7f7f5', 'liso', 1, 0.12),
  negro: m('Negro', '#232325', 'liso', 1, 0.5),
  'gris-basalto': m('Gris basalto', '#7b7f85', 'liso', 1, 0.55),
  'gris-humo': m('Gris humo', '#8d8f8e', 'liso', 1, 0.5),
  jade: m('Jade', '#93a98e', 'liso', 1, 0.5),
  'verde-oliva': m('Verde oliva', '#6f7552', 'liso', 1, 0.5),
  'azul-petroleo': m('Azul petróleo', '#2f4b56', 'liso', 1, 0.5),
  terracota: m('Terracota', '#b86b4b', 'liso', 1, 0.55),
  arena: m('Arena', '#d8cbb3', 'lino', 0.4, 0.6),
  // Melaminas madera
  paraiso: m('Paraíso', '#b48c64', 'madera-clara', 0.9, 0.55),
  'roble-natural': m('Roble natural', '#c8a172', 'roble', 0.9, 0.55),
  'roble-gris': m('Roble gris', '#a69c90', 'roble', 0.9, 0.55),
  nogal: m('Nogal', '#7a5639', 'madera-oscura', 0.9, 0.5),
  'cedro-hayas': m('Haya', '#d6b48c', 'madera-media', 0.9, 0.55),
  wengue: m('Wengué', '#4a3426', 'madera-oscura', 0.8, 0.5),
  rustico: m('Rústico', '#5e3d26', 'madera-oscura', 0.7, 0.6),
  'gris-grafito': m('Gris grafito', '#3f4246', 'lino', 0.4, 0.55),
  'marmol-negro': m('Mármol negro', '#26272a', 'marmol', 0.8, 0.3),
  // Mesadas
  'granito-gris-mara': m('Granito Gris Mara', '#9a9a98', 'granito', 0.5, 0.25),
  'granito-negro': m('Granito Negro Absoluto', '#2a2a2b', 'granito-oscuro', 0.5, 0.15),
  'granito-blanco': m('Granito Blanco Dallas', '#d9d6cf', 'granito', 0.5, 0.25),
  'marmol-carrara': m('Mármol Carrara', '#eeeeea', 'marmol', 1.2, 0.2),
  'cuarzo-blanco': m('Cuarzo blanco', '#f1f0ec', 'liso', 1, 0.2),
  'mesada-madera': m('Mesada de madera', '#b9895a', 'madera-media', 1, 0.45),
  microcemento: m('Microcemento', '#a9a6a1', 'hormigon', 1.5, 0.75),
  'acero-inox': m('Acero inoxidable', '#c9ccd0', 'liso', 1, 0.3, 0.85),
  // Pisos
  'porcellanato-60': m('Porcellanato gris 60×60', '#c9c6c0', 'porcellanato', 1.2, 0.35),
  'ceramico-30': m('Cerámico beige 30×30', '#d8cdb9', 'ceramico', 0.6, 0.5),
  'damero-bn': m('Damero blanco y negro', '#ffffff', 'damero', 0.6, 0.4),
  'parquet-roble': m('Parquet roble', '#c49a6c', 'parquet', 1.2, 0.5),
  'espiga-roble': m('Espiga roble', '#b98d5f', 'espiga', 1, 0.5),
  'cemento-alisado': m('Cemento alisado', '#9d9a95', 'hormigon', 2, 0.8),
  // Paredes / salpicadero
  'pintura-blanca': m('Pintura blanca', '#f3f1ec', 'liso', 1, 0.9),
  'pintura-gris': m('Pintura gris perla', '#d9d8d4', 'liso', 1, 0.9),
  'pintura-verde': m('Pintura verde salvia', '#b7c2ae', 'liso', 1, 0.9),
  'pintura-arena': m('Pintura arena', '#e4d9c6', 'liso', 1, 0.9),
  subway: m('Azulejo subway blanco', '#f4f3ef', 'subway', 0.3, 0.2),
  'subway-verde': m('Azulejo subway verde', '#7f9c8a', 'subway', 0.3, 0.2),
  hexagonal: m('Venecita hexagonal', '#e9e7e2', 'hexagonal', 0.25, 0.25),
  ladrillo: m('Ladrillo visto', '#a5624a', 'ladrillo', 1, 0.85),
}

export const PRESETS_POR_GRUPO: Record<GrupoMaterial, string[]> = {
  frentes: ['blanco', 'blanco-brillo', 'paraiso', 'jade', 'gris-basalto', 'gris-humo', 'negro', 'roble-natural', 'roble-gris', 'nogal', 'cedro-hayas', 'wengue', 'verde-oliva', 'azul-petroleo', 'terracota', 'arena', 'rustico', 'gris-grafito'],
  cuerpos: ['blanco', 'paraiso', 'gris-basalto', 'negro', 'roble-natural', 'nogal', 'arena', 'rustico', 'gris-grafito'],
  mesada: ['granito-gris-mara', 'granito-negro', 'granito-blanco', 'marmol-carrara', 'cuarzo-blanco', 'mesada-madera', 'microcemento', 'acero-inox'],
  zocalo: ['acero-inox', 'negro', 'blanco', 'gris-basalto', 'paraiso'],
  salpicadero: ['subway', 'subway-verde', 'hexagonal', 'granito-gris-mara', 'granito-negro', 'marmol-carrara', 'ladrillo', 'pintura-blanca', 'microcemento'],
  paredes: ['pintura-blanca', 'pintura-gris', 'pintura-verde', 'pintura-arena', 'ladrillo', 'microcemento', 'subway'],
  piso: ['porcellanato-60', 'ceramico-30', 'damero-bn', 'parquet-roble', 'espiga-roble', 'cemento-alisado', 'microcemento'],
  techo: ['pintura-blanca', 'pintura-gris', 'mesada-madera'],
}

export const TEXTURAS: { id: TexturaId; nombre: string }[] = [
  { id: 'liso', nombre: 'Liso' },
  { id: 'lino', nombre: 'Lino / textil' },
  { id: 'madera-clara', nombre: 'Madera clara' },
  { id: 'madera-media', nombre: 'Madera media' },
  { id: 'madera-oscura', nombre: 'Madera oscura' },
  { id: 'roble', nombre: 'Roble' },
  { id: 'marmol', nombre: 'Mármol' },
  { id: 'granito', nombre: 'Granito' },
  { id: 'granito-oscuro', nombre: 'Granito oscuro' },
  { id: 'hormigon', nombre: 'Hormigón / cemento' },
  { id: 'porcellanato', nombre: 'Porcellanato' },
  { id: 'ceramico', nombre: 'Cerámico' },
  { id: 'subway', nombre: 'Azulejo subway' },
  { id: 'hexagonal', nombre: 'Venecita hexagonal' },
  { id: 'damero', nombre: 'Damero' },
  { id: 'parquet', nombre: 'Parquet' },
  { id: 'espiga', nombre: 'Espiga' },
  { id: 'ladrillo', nombre: 'Ladrillo' },
]

export function preset(id: string): MatDef {
  return { ...(MATERIALES_PRESET[id] ?? MATERIALES_PRESET.blanco) }
}

/** Placa de la biblioteca con ese nombre (null si es un color personalizado o una foto). */
export function presetPorNombre(nombre: string): MatDef | null {
  const id = Object.keys(MATERIALES_PRESET).find(k => MATERIALES_PRESET[k].nombre === nombre)
  return id ? preset(id) : null
}

/** Busca colores de melamina en el nombre del producto ("Gris basalto y Paraíso"). */
export function coloresDesdeNombre(nombre: string): { frente?: string; cuerpo?: string } {
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const tieneParaiso = n.includes('paraiso')
  if (n.includes('basalto')) return { frente: 'gris-basalto', cuerpo: tieneParaiso ? 'paraiso' : undefined }
  if (n.includes('jade')) return { frente: 'jade', cuerpo: tieneParaiso ? 'paraiso' : undefined }
  if (tieneParaiso) return { frente: 'paraiso', cuerpo: 'paraiso' }
  return {}
}

/** Temperatura de color (K) → hex. Aproximación de Tanner Helland. */
export function kelvinAHex(k: number): string {
  const t = k / 100
  let r: number, g: number, b: number
  if (t <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(t) - 161.1195681661
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492)
    b = 255
  }
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
