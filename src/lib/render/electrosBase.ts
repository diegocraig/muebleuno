import type { Prisma } from '@prisma/client'
import relevados from './electrosRelevados.json'

// Base de medidas de electrodomésticos (cm: ancho × alto × profundidad).
//
// 1) GENÉRICOS: medidas nominales estándar del mercado argentino, para
//    presupuestar cuando todavía no se sabe la marca. verificado = false.
// 2) RELEVADOS (electrosRelevados.json): modelos reales con la ficha técnica
//    del fabricante o de un retailer como fuente. verificado = true.
//
// Siempre conviene confirmar con la ficha del modelo exacto antes de fabricar.

type Fila = Prisma.ElectrodomesticoCreateManyInput

const g = (tipo: string, modelo: string, ancho: number, alto: number, profundidad: number, extra: Partial<Fila> = {}): Fila => ({
  tipo, marca: 'Genérico', modelo, ancho, alto, profundidad, acabado: 'inox', empotrable: false, verificado: false, ...extra,
})

const GENERICOS: Fila[] = [
  g('cocina', 'Cocina 50 cm', 50, 85, 60, { acabado: 'blanco' }),
  g('cocina', 'Cocina 56 cm', 56, 85, 60),
  g('cocina', 'Cocina 60 cm', 60, 85, 60),
  g('cocina', 'Cocina 76 cm (5 hornallas)', 76, 85, 60),
  g('cocina', 'Cocina 90 cm (semi industrial)', 90, 90, 60),
  g('anafe', 'Anafe 4 hornallas 58 cm', 58, 5, 50, { empotrable: true, caladoAncho: 55, caladoProf: 47 }),
  g('anafe', 'Anafe 4 hornallas 60 cm', 60, 5, 51, { empotrable: true, caladoAncho: 56, caladoProf: 48 }),
  g('anafe', 'Anafe 5 hornallas 75 cm', 75, 5, 51, { empotrable: true, caladoAncho: 72, caladoProf: 48 }),
  g('anafe', 'Anafe 5 hornallas 90 cm', 90, 5, 51, { empotrable: true, caladoAncho: 85, caladoProf: 48 }),
  g('anafe', 'Anafe vitrocerámico 60 cm', 59, 5, 52, { empotrable: true, acabado: 'negro', caladoAncho: 56, caladoProf: 49 }),
  g('horno', 'Horno empotrable 60 cm', 60, 60, 56, { empotrable: true, caladoAncho: 56, caladoProf: 55 }),
  g('horno', 'Horno empotrable 45 cm (compacto)', 60, 45, 56, { empotrable: true, caladoAncho: 56, caladoProf: 55 }),
  g('heladera', 'Heladera con freezer 55 cm', 55, 145, 60, { acabado: 'blanco' }),
  g('heladera', 'Heladera con freezer 60 cm', 60, 170, 65, { acabado: 'blanco' }),
  g('heladera', 'Heladera no frost 70 cm', 70, 185, 70),
  g('heladera', 'Heladera side by side 91 cm', 91, 178, 72),
  g('microondas', 'Microondas 20 L', 45, 26, 35, { acabado: 'blanco' }),
  g('microondas', 'Microondas 28 L', 52, 31, 41),
  g('microondas', 'Microondas empotrable 60 cm', 60, 39, 35, { empotrable: true, acabado: 'negro' }),
  g('campana', 'Campana pared 60 cm', 60, 60, 50),
  g('campana', 'Campana pared 90 cm', 90, 60, 50),
  g('campana', 'Purificador bajo alacena 60 cm', 60, 15, 50, { empotrable: true }),
  g('lavavajillas', 'Lavavajillas 60 cm', 60, 85, 60, { acabado: 'blanco' }),
  g('lavavajillas', 'Lavavajillas 45 cm', 45, 85, 60),
  g('lavavajillas', 'Lavavajillas integrable 60 cm', 60, 82, 55, { empotrable: true }),
  g('lavarropas', 'Lavarropas carga frontal 60 cm', 60, 85, 60, { acabado: 'blanco' }),
  g('bacha', 'Bacha simple 52 × 32', 52, 18, 32, { empotrable: true }),
  g('bacha', 'Bacha simple 60 × 40', 60, 20, 40, { empotrable: true }),
  g('bacha', 'Bacha doble 80 × 45', 80, 18, 45, { empotrable: true }),
]

interface Relevado {
  tipo: string; marca: string; modelo: string
  ancho: number; alto: number; profundidad: number
  calado?: { ancho?: number; profundidad?: number } | null
  acabado?: string; empotrable?: boolean; fuente?: string; dudoso?: boolean
}

const RELEVADOS: Fila[] = (relevados as Relevado[]).map(r => ({
  tipo: r.tipo,
  marca: r.marca,
  modelo: r.modelo,
  ancho: r.ancho,
  alto: r.alto,
  profundidad: r.profundidad,
  caladoAncho: r.calado?.ancho ?? null,
  caladoProf: r.calado?.profundidad ?? null,
  acabado: r.acabado ?? 'inox',
  empotrable: r.empotrable ?? false,
  fuente: r.fuente ?? null,
  verificado: !r.dudoso,
}))

export const ELECTROS_BASE: Fila[] = [...GENERICOS, ...RELEVADOS]
