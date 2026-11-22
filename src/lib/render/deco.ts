import type { DefDeco, TipoDeco } from './tipos'

// Catálogo de decoración: objetos para ambientar el render. No suman al
// presupuesto salvo que se active "Cuenta en el presupuesto" en el objeto.

export type ModoDeco = 'piso' | 'pared' | 'mesada'
export type CategoriaDeco = 'plantas' | 'pared' | 'comedor' | 'adornos' | 'ambiente'

export const NOMBRE_CATEGORIA_DECO: Record<CategoriaDeco, string> = {
  plantas: 'Plantas',
  pared: 'Cuadros y pared',
  comedor: 'Mesas y sillas',
  adornos: 'Adornos de mesada',
  ambiente: 'Alfombras y lámparas',
}

export interface PresetDeco {
  id: string
  nombre: string
  categoria: CategoriaDeco
  modo: ModoDeco
  def: DefDeco
  elevacion?: number      // cm (cuadros, colgantes)
  separacion?: number     // cm desde la pared (adornos de mesada)
  /** Juegos: piezas extra relativas a la primera (x/z en cm, rot en grados). */
  juego?: { def: DefDeco; dx: number; dz: number; rot: number }[]
}

const d = (tipo: TipoDeco, ancho: number, alto: number, profundidad: number, color: string, color2 = '#b9895a', variante = 1): DefDeco =>
  ({ tipo, ancho, alto, profundidad, color, color2, variante })

const silla = d('silla', 44, 84, 50, '#2f2f31', '#b9895a')

export const PRESETS_DECO: PresetDeco[] = [
  // Plantas
  { id: 'ficus', nombre: 'Ficus en maceta', categoria: 'plantas', modo: 'piso', def: d('planta', 55, 160, 55, '#b86b4b', '#4f7a3a', 3) },
  { id: 'monstera', nombre: 'Monstera', categoria: 'plantas', modo: 'piso', def: d('planta', 75, 115, 75, '#e8e4dc', '#3f6e35', 2) },
  { id: 'palmera', nombre: 'Palmera de interior', categoria: 'plantas', modo: 'piso', def: d('planta', 60, 140, 60, '#5b5e61', '#5b8a3f', 4) },
  { id: 'planta-chica', nombre: 'Planta chica', categoria: 'plantas', modo: 'mesada', def: d('planta', 20, 32, 20, '#f2f1ec', '#4f7a3a', 5) },
  { id: 'suculenta', nombre: 'Suculenta', categoria: 'plantas', modo: 'mesada', def: d('planta', 12, 13, 12, '#b86b4b', '#7fa36b', 6) },
  { id: 'aromaticas', nombre: 'Aromáticas (3 macetas)', categoria: 'plantas', modo: 'mesada', def: d('aromaticas', 48, 24, 14, '#b86b4b', '#5b8a3f') },
  // Pared
  { id: 'cuadro-v', nombre: 'Cuadro 60 × 80', categoria: 'pared', modo: 'pared', elevacion: 125, def: d('cuadro', 60, 80, 3, '#1e1e1e', '#efe9df', 1) },
  { id: 'cuadro-h', nombre: 'Cuadro apaisado 100 × 50', categoria: 'pared', modo: 'pared', elevacion: 140, def: d('cuadro', 100, 50, 3, '#b9895a', '#f2efe8', 7) },
  { id: 'cuadro-c', nombre: 'Cuadro chico 30 × 40', categoria: 'pared', modo: 'pared', elevacion: 150, def: d('cuadro', 30, 40, 2.5, '#f2f1ec', '#e9dfcf', 12) },
  { id: 'espejo', nombre: 'Espejo', categoria: 'pared', modo: 'pared', elevacion: 110, def: d('espejo', 60, 90, 3, '#1e1e1e') },
  { id: 'reloj', nombre: 'Reloj de pared', categoria: 'pared', modo: 'pared', elevacion: 175, def: d('reloj', 35, 35, 4, '#1e1e1e', '#f6f5f2') },
  { id: 'estante', nombre: 'Estante flotante con libros', categoria: 'pared', modo: 'pared', elevacion: 150, def: d('estante', 80, 25, 22, '#b9895a', '#c0272d', 3) },
  // Comedor
  { id: 'mesa-rect', nombre: 'Mesa rectangular 140 × 80', categoria: 'comedor', modo: 'piso', def: d('mesa-rect', 140, 76, 80, '#1e1e1e', '#b9895a') },
  { id: 'mesa-redonda', nombre: 'Mesa redonda Ø 100', categoria: 'comedor', modo: 'piso', def: d('mesa-redonda', 100, 76, 100, '#1e1e1e', '#f2f1ec') },
  { id: 'silla', nombre: 'Silla', categoria: 'comedor', modo: 'piso', def: silla },
  { id: 'banqueta', nombre: 'Banqueta alta (isla)', categoria: 'comedor', modo: 'piso', def: d('banqueta', 40, 75, 40, '#1e1e1e', '#b9895a') },
  {
    id: 'juego-comedor', nombre: 'Juego de comedor (mesa + 4 sillas)', categoria: 'comedor', modo: 'piso',
    def: d('mesa-rect', 140, 76, 80, '#1e1e1e', '#b9895a'),
    juego: [
      { def: silla, dx: -35, dz: -55, rot: 0 }, { def: silla, dx: 35, dz: -55, rot: 0 },
      { def: silla, dx: -35, dz: 55, rot: 180 }, { def: silla, dx: 35, dz: 55, rot: 180 },
    ],
  },
  // Adornos de mesada
  { id: 'frutero', nombre: 'Frutero', categoria: 'adornos', modo: 'mesada', def: d('frutero', 28, 13, 28, '#f2f1ec') },
  { id: 'jarron', nombre: 'Jarrón con flores', categoria: 'adornos', modo: 'mesada', def: d('jarron', 16, 45, 16, '#2f4b56', '#e8b7c2', 2) },
  { id: 'libros', nombre: 'Libros de cocina', categoria: 'adornos', modo: 'mesada', def: d('libros', 26, 24, 18, '#c0272d', '#2f4b56', 4) },
  { id: 'tabla', nombre: 'Tabla de picar', categoria: 'adornos', modo: 'mesada', def: d('tabla', 40, 2, 26, '#b9895a') },
  { id: 'cafetera', nombre: 'Cafetera', categoria: 'adornos', modo: 'mesada', def: d('cafetera', 22, 33, 26, '#1e1e1e') },
  // Ambiente
  { id: 'alfombra', nombre: 'Alfombra 160 × 230', categoria: 'ambiente', modo: 'piso', def: d('alfombra', 160, 1, 230, '#8d8f8e', '#e4d9c6', 1) },
  { id: 'colgante', nombre: 'Lámpara colgante', categoria: 'ambiente', modo: 'piso', elevacion: 165, def: d('colgante', 32, 26, 32, '#1e1e1e', '#ffd9a0') },
]

export const presetDeco = (id: string) => PRESETS_DECO.find(p => p.id === id)
