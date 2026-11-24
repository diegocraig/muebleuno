// Tipos compartidos del configurador de cocinas (/render).
// Todas las medidas de la escena están en CENTÍMETROS; la conversión a metros
// para three.js se hace solo en los componentes 3D.

export type Pared = 'fondo' | 'izq' | 'der' | 'frente'
export type Ubicacion = Pared | 'libre'

export const PAREDES: Pared[] = ['fondo', 'izq', 'der', 'frente']
export const NOMBRE_PARED: Record<Ubicacion, string> = {
  fondo: 'Pared del fondo',
  izq: 'Pared izquierda',
  der: 'Pared derecha',
  frente: 'Pared del frente',
  libre: 'Isla / libre',
}

// ─── Muebles ────────────────────────────────────────────────────────────────

export type TipoModulo = 'bajo' | 'alacena' | 'alto' | 'esquinero-bajo' | 'esquinero-alto'

export type TipoColumna =
  | 'puerta'      // puerta ciega (si la columna es ancha se parte en dos hojas)
  | 'vidrio'      // puerta con vidrio
  | 'cajones'     // cajonera
  | 'hueco'       // estante abierto
  | 'micro'       // hueco para microondas + puerta en el resto
  | 'rebatible'   // puerta rebatible (abre hacia arriba)
  | 'bandejero'   // frente extraíble angosto (especiero / bandejero)
  | 'ciego'       // panel fijo sin tirador
  | 'botellero'   // fila de casilleros abiertos (botellero / especiero sobre el microondas)

/** Dónde va la manija de un frente, cuando no sigue la regla general del producto. */
export interface PosTirador {
  orient?: 'h' | 'v'
  pos?: 'arriba' | 'abajo' | 'medio'
  lado?: 'izq' | 'der' | 'centro'
}

/**
 * Una celda del frente. Las columnas de primer nivel parten el ancho del mueble
 * de izquierda a derecha; una celda con `filas` se parte de arriba hacia abajo y
 * una con `columnas` vuelve a partirse a lo ancho (en esos dos casos `tipo` no se usa).
 */
export interface Columna {
  tipo: TipoColumna
  ancho?: number      // cm; sin valor = reparte el ancho restante
  cajones?: number    // solo para 'cajones'
  alto?: number       // cm, dentro de `filas`; sin valor = reparte el alto restante
  filas?: Columna[]
  columnas?: Columna[]
  /** Lado de las bisagras de una puerta (si no, se deduce por su posición). */
  bisagra?: 'izq' | 'der'
  /** Estantes intermedios de un hueco abierto (0 = un solo nicho). */
  estantes?: number
  /** Casilleros de un botellero. */
  divisiones?: number
  /** Proporción del alto de cada cajón, de arriba hacia abajo (ej. [1, 1, 2]). */
  alturas?: number[]
  /** Marco de una puerta vidriada: de la misma placa del frente o de aluminio. */
  marco?: 'frente' | 'aluminio'
  /** Usa el color de acento del producto (fondo del recuadro, frentes de otro color). */
  acento?: boolean
  /** Cajones interiores detrás de una puerta (se ven a través del vidrio), en el color de acento. */
  cajonesInternos?: { cantidad: number; alto: number }
  tirador?: PosTirador
}

/** Manija real del producto. Sin valor, el mueble usa el tirador elegido para el ambiente. */
export type ModeloTirador = 'barra-negra' | 'arco-cromo' | 'unero' | 'ninguno'
export type TipoPatas = 'cromo' | 'negra' | 'aluminio'

export interface DefModulo {
  tipo: TipoModulo
  ancho: number
  alto: number
  profundidad: number
  columnas: Columna[]
  /** Colores sugeridos por el nombre del producto (ids de MATERIALES_PRESET). */
  frente?: string
  cuerpo?: string
  /** El producto (combo) incluye mesada de granito: se dibuja aunque esté desactivada. */
  conMesada?: boolean
  /** Manija del producto (modelo; la orientación y posición salen de reglas por tipo de frente). */
  tirador?: ModeloTirador
  /** Patas a la vista en lugar de zócalo. */
  patas?: TipoPatas
  /** Bajos: listón frontal del cuerpo arriba de los frentes. */
  travesano?: boolean
  /** Frentes embutidos dentro del cuerpo (se ven los cantos de los laterales). */
  embutido?: boolean
  /** Esquineros: frentes del brazo contra la pared y del brazo perpendicular, desde el extremo hacia el rincón. */
  columnasB?: Columna[]
  /** Color de acento (id de MATERIALES_PRESET) para las celdas con `acento`. */
  acento?: string
  /** El diseño fue relevado de la foto del catálogo (no deducido del nombre). */
  ficha?: boolean
}

/** Un combo del catálogo se despliega en varios módulos agrupados. */
export interface DefCombo {
  componentes: DefModulo[]
  /** Corrimiento (cm) de cada componente desde el inicio del combo; sin valor, las alacenas van una al lado de la otra. */
  posiciones?: number[]
}

// ─── Electrodomésticos ──────────────────────────────────────────────────────

export type TipoElectro =
  | 'cocina' | 'anafe' | 'horno' | 'heladera' | 'microondas'
  | 'campana' | 'lavavajillas' | 'bacha' | 'lavarropas'

export const NOMBRE_ELECTRO: Record<TipoElectro, string> = {
  cocina: 'Cocina',
  anafe: 'Anafe',
  horno: 'Horno empotrable',
  heladera: 'Heladera',
  microondas: 'Microondas',
  campana: 'Campana / purificador',
  lavavajillas: 'Lavavajillas',
  bacha: 'Bacha / pileta',
  lavarropas: 'Lavarropas',
}

export type Acabado = 'inox' | 'blanco' | 'negro' | 'gris' | 'otro'

export interface DefElectro {
  tipo: TipoElectro
  ancho: number
  alto: number
  profundidad: number
  acabado: Acabado
  empotrable: boolean
  marca?: string
  modelo?: string
}

/** Fila de la base de electrodomésticos tal como la manda la API. */
export interface ElectroCatalogo {
  id: number
  tipo: TipoElectro
  marca: string
  modelo: string
  ancho: number
  alto: number
  profundidad: number
  caladoAncho: number | null
  caladoProf: number | null
  acabado: Acabado
  empotrable: boolean
  precio: number | null
  fuente: string | null
  verificado: boolean
}

/** Producto de cocina del catálogo, ya con su definición 3D resuelta. */
export interface ProductoCatalogo {
  id: number
  nombre: string
  slug: string
  precio: number          // precio vigente (oferta si hay)
  precioLista: number
  imagen: string | null
  subcategoria: string | null
  grupo: 'bajo' | 'alacena' | 'alto' | 'combo' | 'esquinero' | 'ajuste'
  def: DefModulo | null
  combo: DefCombo | null
  ajustado: boolean       // tiene override guardado en RenderModulo
}

// ─── Decoración ─────────────────────────────────────────────────────────────

export type TipoDeco =
  | 'planta' | 'aromaticas' | 'cuadro' | 'espejo' | 'reloj' | 'estante'
  | 'mesa-rect' | 'mesa-redonda' | 'silla' | 'banqueta' | 'alfombra' | 'colgante'
  | 'jarron' | 'frutero' | 'libros' | 'tabla' | 'cafetera'

export interface DefDeco {
  tipo: TipoDeco
  ancho: number
  alto: number
  profundidad: number
  color: string        // color principal (maceta, marco, silla, alfombra…)
  color2: string       // secundario (madera de la mesa, fondo del cuadro…)
  variante: number     // semilla: diseño del cuadro, forma de la planta…
  imagen?: string      // foto propia (cuadros)
}

// ─── Materiales ─────────────────────────────────────────────────────────────

export type TexturaId =
  | 'liso' | 'madera-clara' | 'madera-media' | 'madera-oscura' | 'roble'
  | 'marmol' | 'granito' | 'granito-oscuro' | 'hormigon' | 'lino'
  | 'ceramico' | 'porcellanato' | 'subway' | 'damero' | 'parquet' | 'espiga'
  | 'ladrillo' | 'hexagonal'

export interface MatDef {
  nombre: string
  color: string           // #rrggbb (multiplica a la textura)
  textura: TexturaId
  imagen?: string         // URL de una textura propia (subida); reemplaza a `textura`
  escala: number          // metros que ocupa una repetición de la textura
  rugosidad: number       // 0..1
  metalico: number        // 0..1
}

export type GrupoMaterial =
  | 'frentes' | 'cuerpos' | 'mesada' | 'zocalo' | 'salpicadero'
  | 'paredes' | 'piso' | 'techo'

export const NOMBRE_GRUPO: Record<GrupoMaterial, string> = {
  frentes: 'Frentes (puertas y cajones)',
  cuerpos: 'Cuerpos / interiores',
  mesada: 'Mesada',
  zocalo: 'Zócalo',
  salpicadero: 'Salpicadero',
  paredes: 'Paredes',
  piso: 'Piso',
  techo: 'Techo',
}

export type EstiloTirador = 'barra' | 'boton' | 'perfil' | 'gola' | 'push'

// ─── Escena ─────────────────────────────────────────────────────────────────

export interface Abertura {
  id: string
  pared: Pared
  tipo: 'ventana' | 'puerta'
  s: number         // cm desde el inicio de la pared
  ancho: number
  alto: number
  elevacion: number // cm desde el piso
}

export interface Item {
  id: string
  origen: 'producto' | 'electro' | 'generico' | 'deco'
  productoId?: number
  electroId?: number
  nombre: string
  /** Precio unitario de referencia (se recalcula con el catálogo vigente). */
  precio: number
  /** Ítems de un mismo combo comparten grupo; solo el primero lleva el precio. */
  grupo?: string
  /** Combos: índice del componente del producto que representa esta pieza. */
  componente?: number
  cuentaEnPresupuesto: boolean
  modulo?: DefModulo
  electro?: DefElectro
  deco?: DefDeco
  /** Distancia del fondo del objeto a la pared (cm); para adornos y deco. */
  separacion?: number
  ubicacion: Ubicacion
  s: number          // cm a lo largo de la pared (borde izquierdo del mueble)
  x?: number         // libre: centro en planta (cm)
  z?: number
  rot?: number       // libre: rotación en grados (múltiplos de 90)
  elevacion: number  // cm desde el piso hasta la base del mueble
  /** Esquineros: hacia qué lado sale el brazo perpendicular. */
  esquina?: 'izq' | 'der'
  /** Bisagras del lado izquierdo (por defecto derecho para puertas simples). */
  espejado?: boolean
  frente?: MatDef
  cuerpo?: MatDef
  bloqueado?: boolean
}

export interface Estandares {
  zocalo: number
  alturaBajo: number        // altura total del bajo mesada incluido zócalo (sin mesada)
  profBajo: number
  espesorMesada: number
  profMesada: number        // profundidad de la mesada (desde la pared)
  mesadaActiva: boolean
  lineaAlacenas: number     // altura del borde superior de las alacenas
  profAlacena: number
  salpicadero: boolean
}

export interface Luces {
  preset: string
  exposicion: number
  ambiente: number          // luz hemisférica
  entorno: number           // reflejos (environment map)
  sol: { activo: boolean; azimut: number; elevacion: number; intensidad: number; temperatura: number }
  techo: { activo: boolean; filas: number; columnas: number; intensidad: number; temperatura: number; tipo: 'spot' | 'panel' }
  led: { activo: boolean; intensidad: number; temperatura: number }
  sombras: boolean
  fondo: string
}

export interface Escena {
  version: 1
  ambiente: {
    ancho: number   // eje X (pared del fondo)
    largo: number   // eje Z (paredes laterales)
    alto: number
    paredes: Record<Pared, boolean>
    aberturas: Abertura[]
  }
  estandares: Estandares
  materiales: Record<GrupoMaterial, MatDef>
  tirador: { estilo: EstiloTirador; color: string; metalico: number }
  luces: Luces
  items: Item[]
}

// ─── Presupuesto ────────────────────────────────────────────────────────────

export interface Extra {
  id: string
  concepto: string
  cantidad: number
  precioUnitario: number
}

export interface Presupuesto {
  extras: Extra[]
  mesadaPorMetro: boolean
  precioMesadaMl: number
  incluirElectros: boolean
  descuentoPct: number
  tipoEnvioId: number | null
  notas: string
  validezDias: number
}

export interface DatosProyecto {
  id?: number
  nombre: string
  cliente: string
  email: string
  telefono: string
  estado: 'borrador' | 'presupuesto' | 'venta'
  pedidoId?: number | null
}

export interface TipoEnvioOpcion { id: number; nombre: string; costo: number }
