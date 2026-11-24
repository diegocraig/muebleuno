import type { Columna, DefCombo, DefModulo, TipoModulo } from './tipos'

// Diseño 3D de cada producto del catálogo de cocina, relevado de su foto:
// cantidad y distribución de puertas, cajones, rebatibles, huecos y botelleros,
// modelo de manija, patas y detalles del cuerpo. Las medidas siguen saliendo del
// nombre del producto (medidas.ts); acá solo se describe cómo es el frente.
//
// Reglas de manija (iguales en todas las fotos, ver Mueble3D):
//  · barra negra horizontal; en alacenas abajo, en bajos arriba, del lado que abre.
//  · rebatibles: centrada en el borde de abajo. Cajones: centrada arriba.
//  · despenseros: arco cromado vertical, del lado que abre.
//  · línea Paraíso / Jade / Gris basalto: uñero (sin manija a la vista).
// Bisagras: si no se indican, la puerta suelta abre hacia la derecha (bisagra a la
// izquierda) y en un grupo de puertas la última abre hacia la izquierda.
//
// Si se agrega un producto nuevo y no figura acá, se dibuja con lo que se deduce
// del nombre (medidas.ts) usando estas mismas manijas y patas.

// ─── Piezas ─────────────────────────────────────────────────────────────────

const P = (ancho?: number, extra: Partial<Columna> = {}): Columna => ({ tipo: 'puerta', ...(ancho ? { ancho } : {}), ...extra })
const V = (ancho?: number, extra: Partial<Columna> = {}): Columna => ({ tipo: 'vidrio', ...(ancho ? { ancho } : {}), ...extra })
const R = (alto?: number): Columna => ({ tipo: 'rebatible', ...(alto ? { alto } : {}) })
const H = (estantes = 0, extra: Partial<Columna> = {}): Columna => ({ tipo: 'hueco', estantes, ...extra })
const B = (divisiones: number, alto: number): Columna => ({ tipo: 'botellero', divisiones, alto })
const C = (ancho?: number, cajones = 3, alturas = [1, 1, 2.4]): Columna => ({ tipo: 'cajones', cajones, alturas, ...(ancho ? { ancho } : {}) })
/** Celda partida en filas (de arriba hacia abajo). */
const F = (ancho: number | undefined, ...filas: Columna[]): Columna => ({ tipo: 'puerta', ...(ancho ? { ancho } : {}), filas })
/** Celda partida en columnas (dentro de una fila). */
const K = (alto: number | undefined, ...columnas: Columna[]): Columna => ({ tipo: 'puerta', ...(alto ? { alto } : {}), columnas })

// ─── Líneas de producto ─────────────────────────────────────────────────────

const ALACENA_BLANCA: Partial<DefModulo> = { tirador: 'barra-negra' }
const BAJO_BLANCO: Partial<DefModulo> = { tirador: 'barra-negra', patas: 'cromo', travesano: true }
const ALACENA_COLOR: Partial<DefModulo> = { tirador: 'unero', embutido: true }
const BAJO_COLOR: Partial<DefModulo> = { tirador: 'unero', embutido: true, patas: 'aluminio', travesano: true }
const DESPENSERO: Partial<DefModulo> = { tirador: 'arco-cromo', patas: 'negra' }

type Ficha = Partial<DefModulo> & { columnas: Columna[] }
const a = (columnas: Columna[], extra: Partial<DefModulo> = {}): Ficha => ({ ...ALACENA_BLANCA, ...extra, columnas })
const b = (columnas: Columna[], extra: Partial<DefModulo> = {}): Ficha => ({ ...BAJO_BLANCO, ...extra, columnas })
const ac = (columnas: Columna[]): Ficha => ({ ...ALACENA_COLOR, columnas })
const bc = (columnas: Columna[]): Ficha => ({ ...BAJO_COLOR, columnas })
const d = (columnas: Columna[], extra: Partial<DefModulo> = {}): Ficha => ({ ...DESPENSERO, ...extra, columnas })

// Diseños que se repiten en varios productos.
const DOS_REBATIBLES = [F(undefined, R(), R())]
const PUERTAS_Y_REBATIBLE = [F(undefined, K(undefined, P(), P()), R())]
const COLOR_PUERTAS_Y_HUECO = [F(undefined, K(36, P(), P()), H(0))]
const COLOR_PUERTA_LATERAL = (ancho: number) => [P(ancho), F(undefined, K(36, P(), P()), H(0))]
const CAJONERA_IZQ_2P = [C(40), P(), P()]
const COLOR_2P_CAJONERA = [P(), P(), C(40, 3, [1, 1, 2.2])]

/** Diseño de cada producto por id (tabla Producto). */
export const FICHAS: Record<number, Ficha> = {
  // ── Alacenas blancas ──
  10: a([H(2, { ancho: 20 }), ...DOS_REBATIBLES]),                       // 1 MT x 60: nichos a la izquierda + 2 rebatibles
  75: a([H(2, { ancho: 15 }), ...PUERTAS_Y_REBATIBLE]),                  // 1 MT x 60: nichos + 2 puertas arriba y rebatible
  38: a([R(), H(0, { ancho: 45 })]),                                     // 120 x 30 con hueco
  39: a([R(), R()]),                                                     // 120 x 30 dos puertas (rebatibles)
  151: a([R(), R()]),                                                    // 120 x 40 dos puertas (rebatibles)
  25: a([P(35), ...PUERTAS_Y_REBATIBLE]),                                // 120 x 60
  86: a([P(22.5), P(22.5), ...DOS_REBATIBLES]),                          // 120 x 60 (dos puertas + 2 rebatibles)
  87: a([P(35), ...DOS_REBATIBLES]),                                     // 120 x 60 STD
  69: a([P(30), F(undefined, R(), H(0)), P(30)]),                        // 120 x 60 con hueco
  61: a([P(30), F(undefined, B(4, 13), H(0)), P(30)]),                   // 120 x 60 portamicroondas (centro)
  85: a([F(55, B(4, 15), H(0)), ...DOS_REBATIBLES]),                     // 120 x 60 portamicroondas
  30: a([F(55, B(4, 15), H(0)), ...PUERTAS_Y_REBATIBLE]),                // portamicroondas 120 x 60
  58: a([P(30), F(undefined, R(), H(0, { acento: true }))], { acento: 'marmol-negro' }), // recuadro de color
  16: a([P(), P(), P()]),                                                // 120 x 60 tres puertas ciegas
  82: a([P(30), F(undefined, R(32), H(1)), P(30)]),                      // 120 x 80
  15: a([P(30), ...DOS_REBATIBLES]),                                     // 90 x 60
  28: a(PUERTAS_Y_REBATIBLE),                                            // 80 x 60
  98: a(DOS_REBATIBLES),                                                 // 80 x 60
  32: a([H(2, { ancho: 20 }), ...DOS_REBATIBLES]),                       // 70 x 60
  27: a(DOS_REBATIBLES),                                                 // 60 x 60
  23: a(DOS_REBATIBLES),                                                 // 50 x 60
  34: a([P(), P()]),                                                     // 60 x 60 dos puertas
  36: a([P()]), 44: a([P()]), 96: a([P()]), 53: a([P()]),                // 40, 30, 35 x 60 y 30 x 80: una puerta
  52: a([P(), P()]), 88: a([P(), P()]),                                  // 80 y 60 x 30 dos puertas
  21: a([R()]), 40: a([R()]), 67: a([R()]), 68: a([R()]), 99: a([R()]), 29: a([R()]), // x 30 / x 40: un rebatible
  42: a([F(undefined, B(4, 15), H(0))]),                                 // 60 x 60 portamicroondas
  37: a([H(1, { ancho: 20 }), F(undefined, B(4, 15), H(0))]),           // 80 x 60 portamicroondas
  74: a([F(undefined, R(36), H(0))]),                                    // 60 x 80 portamicroondas con rebatible
  63: a([F(undefined, R(), H(0))]),                                      // 80 x 60 rebatible y hueco abajo
  60: a([P(30), H(1)]),                                                  // 45 x 60 con estante abierto
  62: a([H(2)]),                                                         // especiero de ajuste 15 x 60
  97: a([P(30), H(1)], { columnasB: [H(1)] }),                           // alacena esquinera 90 x 60

  // ── Alacenas Paraíso con Jade / Gris basalto ──
  102: ac([P(28), P(28), ...COLOR_PUERTAS_Y_HUECO]), 103: ac([P(28), P(28), ...COLOR_PUERTAS_Y_HUECO]),
  104: ac(COLOR_PUERTA_LATERAL(40)), 105: ac(COLOR_PUERTA_LATERAL(40)),
  106: ac(COLOR_PUERTA_LATERAL(38)), 115: ac(COLOR_PUERTA_LATERAL(32)),
  107: ac([F(undefined, P(undefined, { alto: 36 }), H(0))]), 108: ac([F(undefined, P(undefined, { alto: 36 }), H(0))]),
  109: ac(COLOR_PUERTAS_Y_HUECO), 110: ac(COLOR_PUERTAS_Y_HUECO), 111: ac(COLOR_PUERTAS_Y_HUECO),
  112: ac(COLOR_PUERTAS_Y_HUECO), 113: ac(COLOR_PUERTAS_Y_HUECO), 114: ac(COLOR_PUERTAS_Y_HUECO),

  // ── Bajos mesada blancos ──
  13: b(CAJONERA_IZQ_2P), 54: b(CAJONERA_IZQ_2P), 18: b(CAJONERA_IZQ_2P), // 1,20 / 1,40 / 1 mt con cajonera
  17: b([C(40), P()]), 64: b([C(40), P()]),                              // 90 y 80 con cajonera
  41: b([C()]), 90: b([C()]),                                            // 40 y 60 cajonera
  77: b([P(), P()]), 73: b([P(), P()]), 71: b([P(), P()]), 91: b([P(), P()]), 55: b([P(), P()]),
  100: b([P(), P(), P()]), 93: b([P(), P(), P()]), 95: b([P(), P(), P()]),
  70: b([P()]), 83: b([P()]), 89: b([P()]),                              // 30, 35 y 40: una puerta
  79: b([H(0, { ancho: 12 }), P()]), 92: b([H(0, { ancho: 12 }), P()]),  // con bandejero (ranura abierta)
  78: b([H(0)]),                                                         // ajuste 15 cm
  59: b([P()], { columnasB: [H(0)] }),                                   // esquinero 90 x 90

  // ── Bajos mesada Paraíso con Jade / Gris basalto ──
  116: bc(COLOR_2P_CAJONERA), 121: bc(COLOR_2P_CAJONERA), 119: bc(COLOR_2P_CAJONERA), 120: bc(COLOR_2P_CAJONERA),
  122: bc(COLOR_2P_CAJONERA), 123: bc(COLOR_2P_CAJONERA),
  117: bc([P(), P(), P()]), 118: bc([P(), P(), P()]),
  124: bc([C(undefined, 3, [1, 1, 2.2])]), 125: bc([C(undefined, 3, [1, 1, 2.2])]),
  126: bc([C(undefined, 3, [1, 1, 2.2])]), 127: bc([C(undefined, 3, [1, 1, 2.2])]),
  128: bc([C(undefined, 3, [1, 1, 2.2])]), 129: bc([C(undefined, 3, [1, 1, 2.2])]),
  130: bc([P(), P()]), 131: bc([P(), P()]), 132: bc([P(), P()]), 133: bc([P(), P()]),

  // ── Despenseros y organizadores ──
  9: d([V(), V()]),                                                      // vidriado 130 x 60
  14: d([V()]),                                                          // vidriado 130 x 30
  31: d([F(undefined, K(110, V(), V()), K(undefined, P(), P()))]),       // vidriado 180 x 60
  35: d([P(), P()]),                                                     // 180 x 60 dos puertas
  80: d([F(undefined, K(115, V(undefined, { marco: 'aluminio' }), V(undefined, { marco: 'aluminio' })), K(undefined, P(undefined, { acento: true }), P(undefined, { acento: true })))],
    { tirador: 'ninguno', frente: 'gris-grafito', cuerpo: 'gris-grafito', acento: 'rustico' }),
  81: d([F(undefined, K(115, V(undefined, { marco: 'aluminio' }), V(undefined, { marco: 'aluminio' })), K(undefined, P(undefined, { acento: true }), P(undefined, { acento: true })))],
    { frente: 'gris-grafito', cuerpo: 'gris-grafito', acento: 'rustico' }),
  // vidriado 1,50 x 60: dos puertas de vidrio con marco de aluminio, estantes y dos cajones internos grises por lado.
  94: d([V(undefined, { marco: 'aluminio', cajonesInternos: { cantidad: 2, alto: 38 } }), V(undefined, { marco: 'aluminio', cajonesInternos: { cantidad: 2, alto: 38 } })],
    { tirador: 'ninguno', patas: 'aluminio', cuerpo: 'roble-natural', embutido: true, acento: 'gris-humo' }),
  101: d([V(50), F(undefined, H(3, { alto: 112 }), C(undefined, 3, [1, 1, 1]))], { cuerpo: 'rustico' }),
  12: d([F(undefined, H(0, { alto: 45 }), K(undefined, V(), V()))]),     // portamicroondas vidriado 130 x 60
  45: d([F(undefined, H(1, { alto: 45 }), V())]),                        // vidriado 130 x 30 puerta y estante
  51: d([F(undefined, H(0, { alto: 30 }), K(undefined, V(), V()))], { patas: 'aluminio' }), // multiusos 90 x 60
}

// ─── Combos ─────────────────────────────────────────────────────────────────

const PROF = { bajo: 58, alacena: 30 }
const mod = (tipo: TipoModulo, ancho: number, alto: number, f: Ficha): DefModulo =>
  ({ tipo, ancho, alto, profundidad: tipo === 'bajo' ? PROF.bajo : PROF.alacena, ficha: true, ...f })

/** Combos por id: cada pieza con su diseño y su lugar a lo largo de la pared. */
export const FICHAS_COMBO: Record<number, (altoBajo: number, altoAlacena: number) => DefCombo> = {
  // Combo 1 MT: bajo 1 mt con cajonera + alacena 1 MT con nichos y 2 rebatibles.
  150: (hb, ha) => ({ componentes: [mod('bajo', 100, hb, FICHAS[18]), mod('alacena', 100, ha, FICHAS[10])] }),
  148: (hb, ha) => ({ componentes: [{ ...mod('bajo', 100, hb, FICHAS[18]), conMesada: true }, mod('alacena', 100, ha, FICHAS[10])] }),
  // Combo 1,20: bajo 1,20 con cajonera + alacena 120 x 60 STD.
  149: (hb, ha) => ({ componentes: [mod('bajo', 120, hb, FICHAS[13]), mod('alacena', 120, ha, FICHAS[87])] }),
  19: (hb, ha) => ({ componentes: [{ ...mod('bajo', 120, hb, FICHAS[13]), conMesada: true }, mod('alacena', 120, ha, FICHAS[87])] }),
  // Combo 1,20 Paraíso y Jade: bajo con hueco para microondas y cajón + alacena con puerta lateral y hueco.
  20: (hb, ha) => ({
    componentes: [
      mod('bajo', 120, hb, { tirador: 'unero', embutido: true, travesano: true, frente: 'jade', cuerpo: 'paraiso', columnas: [F(55, H(0), { ...C(undefined, 1, [1]), alto: 20 }), P(), P()] }),
      mod('alacena', 120, ha, { tirador: 'unero', embutido: true, frente: 'jade', cuerpo: 'paraiso', columnas: COLOR_PUERTA_LATERAL(40) }),
    ],
  }),
  // Combo cocina completo: bajo 1,60 (en tres módulos, con lugar para la cocina) + alacena 3 MT.
  146: (hb, ha) => ({
    componentes: [
      mod('bajo', 80, hb, b([P(), P()])),
      mod('bajo', 40, hb, b([C()])),
      mod('bajo', 40, hb, b([P(undefined, { bisagra: 'der' })])),
      mod('alacena', 70, ha, a(DOS_REBATIBLES)),
      mod('alacena', 40, ha, a([P()])),
      mod('alacena', 60, ha, a([F(undefined, K(30, P(), P()), H(0))])),
      mod('alacena', 40, ha, a([P(undefined, { bisagra: 'der' })])),
      mod('alacena', 80, 40, a([R()])),
    ],
    posiciones: [0, 80, 180, 0, 70, 110, 170, 210],
  }),
}
