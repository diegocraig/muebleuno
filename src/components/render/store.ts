'use client'
import { create } from 'zustand'
import { current, produce } from 'immer'
import type {
  DatosProyecto, ElectroCatalogo, Escena, Item, Pared, Presupuesto, ProductoCatalogo, TipoEnvioOpcion, Ubicacion,
} from '@/lib/render/tipos'
import {
  caja, combinarAnchos, defOriginal, elevacionPorDefecto, normalizarEscena, normalizarPresupuesto, esquinaPorDefecto, escenaInicial, imantar, largoPared, medidas, piezasDe, PRESUPUESTO_DEFAULT,
  primerHueco, productoPorAncho, topeMesada, transformar, uid,
} from '@/lib/render/escena'
import { preset, presetPorNombre } from '@/lib/render/materiales'
import { NOMBRE_PARED } from '@/lib/render/tipos'
import type { PresetDeco } from '@/lib/render/deco'

export type Camara = 'perspectiva' | 'planta' | 'frente'
export type Panel = 'seleccion' | 'ambiente' | 'materiales' | 'luz' | 'presupuesto'

interface Vista {
  camara: Camara
  cotas: boolean
  puertasAbiertas: boolean
  techo: boolean
  calidad: 'normal' | 'alta'
  imanes: boolean
}

interface Estado {
  escena: Escena
  pasado: Escena[]
  futuro: Escena[]
  seleccion: string | null
  arrastrando: boolean
  capturando: boolean
  paredDestino: Ubicacion
  panel: Panel
  vista: Vista
  proyecto: DatosProyecto
  presupuesto: Presupuesto
  sucio: boolean
  catalogo: ProductoCatalogo[]
  electros: ElectroCatalogo[]
  envios: TipoEnvioOpcion[]
  aviso: { texto: string; tipo: 'ok' | 'error' } | null
  camaraVersion: number

  mutar: (fn: (e: Escena) => void, historia?: boolean) => void
  marcarHistoria: () => void
  deshacer: () => void
  rehacer: () => void
  seleccionar: (id: string | null) => void
  setVista: (v: Partial<Vista>) => void
  setPanel: (p: Panel) => void
  setParedDestino: (p: Ubicacion) => void
  setArrastrando: (b: boolean) => void
  setProyecto: (p: Partial<DatosProyecto>) => void
  setPresupuesto: (fn: (p: Presupuesto) => void) => void
  setCatalogo: (c: ProductoCatalogo[]) => void
  setElectros: (e: ElectroCatalogo[]) => void
  avisar: (texto: string, tipo?: 'ok' | 'error') => void
  cargar: (esc: Escena, pres: Presupuesto, proy: DatosProyecto) => void
  nuevo: () => void
  recentrarCamara: () => void

  agregarProducto: (p: ProductoCatalogo) => void
  agregarElectro: (e: ElectroCatalogo) => void
  agregarGenerico: (tipo: 'bajo' | 'alacena' | 'alto') => void
  agregarDeco: (p: PresetDeco) => void
  moverItem: (id: string, s: number, imanes?: boolean) => void
  moverLibre: (id: string, x: number, z: number) => void
  cambiarUbicacion: (id: string, u: Ubicacion) => void
  actualizarItem: (id: string, fn: (it: Item) => void, historia?: boolean) => void
  duplicar: (id: string) => void
  rotarItem: (id: string) => void
  borrar: (id: string) => void
  autocompletar: (pared: Pared) => void
}

const MAX_HISTORIA = 80

/** Ubica un ítem nuevo: primer hueco en la pared elegida, o en cualquier otra. */
function ubicarNuevo(esc: Escena, it: Item, preferida: Ubicacion): Item {
  if (preferida === 'libre') {
    return { ...it, ubicacion: 'libre', x: esc.ambiente.ancho / 2, z: esc.ambiente.largo / 2, rot: 0, s: 0 }
  }
  const orden: Pared[] = [preferida, ...(['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(p => p !== preferida && esc.ambiente.paredes[p])]
  for (const p of orden) {
    const s = primerHueco(esc, it, p)
    if (s !== null) return { ...it, ubicacion: p, s }
  }
  return { ...it, ubicacion: preferida, s: 0 }
}

function itemDeProducto(p: ProductoCatalogo, def: NonNullable<ProductoCatalogo['def']>, esc: Escena, extra: Partial<Item> = {}): Item {
  return {
    id: uid(),
    origen: 'producto',
    productoId: p.id,
    nombre: p.nombre,
    precio: p.precio,
    cuentaEnPresupuesto: true,
    modulo: structuredClone(def),
    ubicacion: 'fondo',
    s: 0,
    elevacion: elevacionPorDefecto(def, null, esc.estandares),
    ...(def.frente ? { frente: preset(def.frente) } : {}),
    ...(def.cuerpo ? { cuerpo: preset(def.cuerpo) } : {}),
    ...extra,
  }
}

/**
 * Los muebles del catálogo siempre se dibujan con el diseño vigente de su producto
 * (frentes, manijas, patas...): al abrir un proyecto guardado o al recargar el
 * catálogo se les vuelve a copiar, conservando solo lo que es de ese proyecto
 * (medidas, colores, ubicación). Devuelve la misma escena si no cambió nada.
 */
function sincronizarDisenos(esc: Escena, catalogo: ProductoCatalogo[]): Escena {
  if (!catalogo.length) return esc
  const refs = new Map(catalogo.map(p => [p.id, { precio: p.precio, def: p.def, combo: p.combo }]))
  return produce(esc, e => {
    for (const it of e.items) {
      if (it.origen !== 'producto' || !it.modulo || !it.productoId) continue
      const piezas = piezasDe(e, it)
      const orig = defOriginal(it, refs.get(it.productoId), piezas)
      if (!orig) continue
      if (it.grupo && it.componente === undefined) it.componente = piezas.indexOf(it)
      const { ancho, alto, profundidad } = it.modulo
      const nuevo = { ...structuredClone(orig), ancho, alto, profundidad }
      if (JSON.stringify(nuevo) !== JSON.stringify(current(it).modulo)) it.modulo = nuevo
      // Los colores propios del mueble se eligen de la biblioteca de placas: si una
      // placa se recalibró (ej. Gris basalto), se toma el valor vigente.
      for (const k of ['frente', 'cuerpo'] as const) {
        const m = it[k]
        const vigente = m && !m.imagen ? presetPorNombre(m.nombre) : null
        if (vigente && JSON.stringify(vigente) !== JSON.stringify(current(m))) it[k] = vigente
      }
    }
  })
}

// ─── Esquinero automático ───────────────────────────────────────────────────

/** Para cada extremo de una pared: con qué pared hace esquina y en qué extremo de esa vecina. */
const ESQUINAS: Record<Pared, { fin: boolean; vecina: Pared; vecinaAlFinal: boolean }[]> = {
  fondo: [{ fin: false, vecina: 'izq', vecinaAlFinal: false }, { fin: true, vecina: 'der', vecinaAlFinal: false }],
  frente: [{ fin: false, vecina: 'izq', vecinaAlFinal: true }, { fin: true, vecina: 'der', vecinaAlFinal: true }],
  izq: [{ fin: false, vecina: 'fondo', vecinaAlFinal: false }, { fin: true, vecina: 'frente', vecinaAlFinal: false }],
  der: [{ fin: false, vecina: 'fondo', vecinaAlFinal: true }, { fin: true, vecina: 'frente', vecinaAlFinal: true }],
}

/**
 * Al completar `pared`: si la pared vecina ya tiene un tramo del mismo nivel que
 * llega hasta el rincón, completar así dejaría una esquina ciega (un módulo tapa
 * el frente del otro). En ese caso se pone el esquinero del catálogo en el rincón
 * y se reemplazan los módulos de la vecina que caían en esa zona por otros que
 * llenen el espacio que queda.
 *
 * No toca nada si en la zona hay algo que no sea un módulo simple del catálogo
 * (bloqueado, combo, a medida, electrodoméstico) o una puerta/ventana.
 * Devuelve qué hizo, para el aviso.
 */
function esquineroAutomatico(
  esc: Escena, pared: Pared, tipoMod: 'bajo' | 'alacena',
  mapa: Map<number, ProductoCatalogo>, esquinero: ProductoCatalogo | undefined,
): { vecina: Pared; reemplazados: number }[] {
  const hechos: { vecina: Pared; reemplazados: number }[] = []
  if (!esquinero?.def) return hechos
  const eW = esquinero.def.ancho
  const L = largoPared(esc, pared)
  const anchos = [...mapa.keys()]
  const suma = (v: number[]) => v.reduce((a, b) => a + b, 0)

  for (const { fin, vecina, vecinaAlFinal } of ESQUINAS[pared]) {
    if (!esc.ambiente.paredes[vecina] || L < eW + 30) continue
    const LA = largoPared(esc, vecina)
    /** Distancia al rincón, a lo largo de la vecina: [borde cercano, borde lejano]. */
    const dist = (o: Item): [number, number] => {
      const w = medidas(o).ancho
      return vecinaAlFinal ? [LA - (o.s + w), LA - o.s] : [o.s, o.s + w]
    }
    const nuevo = itemDeProducto(esquinero, esquinero.def, esc, { ubicacion: pared, s: fin ? L - eW : 0 })
    nuevo.esquina = esquinaPorDefecto(pared, nuevo.s, L)
    const cE = caja(nuevo, esc)
    // Para los bajos la banda llega hasta arriba de la mesada: no se saca un módulo con bacha o anafe encima.
    const y1 = tipoMod === 'bajo' ? topeMesada(esc.estandares) + 30 : cE.y1
    const enBanda = (o: Item) => { const c = caja(o, esc); return c.y0 < y1 - 0.5 && cE.y0 < c.y1 - 0.5 }
    const enRincon = (o: Item) => { const c = caja(o, esc); return c.x0 < cE.x1 - 0.5 && cE.x0 < c.x1 - 0.5 && c.z0 < cE.z1 - 0.5 && cE.z0 < c.z1 - 0.5 }

    // ¿Ya hay un esquinero ahí? ¿Hay una puerta o ventana en la zona?
    if (esc.items.some(o => o.modulo?.tipo.startsWith('esquinero') && enBanda(o) && enRincon(o))) continue
    const abertura = esc.ambiente.aberturas.some(ab => {
      if (!(ab.elevacion < cE.y1 && cE.y0 < ab.elevacion + ab.alto)) return false
      if (ab.pared === pared) return fin ? ab.s + ab.ancho > L - eW : ab.s < eW
      if (ab.pared === vecina) return vecinaAlFinal ? ab.s + ab.ancho > LA - eW : ab.s < eW
      return false
    })
    if (abertura) continue

    // El tramo de la vecina tiene que llegar hasta el rincón con un módulo de este nivel.
    const deVecina = esc.items.filter(o => o.ubicacion === vecina && !o.deco && enBanda(o)).sort((a, b) => dist(a)[0] - dist(b)[0])
    const primero = deVecina[0]
    if (!primero || dist(primero)[0] > 1 || primero.modulo?.tipo !== tipoMod) continue
    // Y en esta pared el rincón tiene que estar libre.
    if (esc.items.some(o => o.ubicacion === pared && !o.deco && enBanda(o) && (fin ? o.s + medidas(o).ancho > L - eW + 0.5 : o.s < eW - 0.5))) continue

    // Módulos de la vecina a reemplazar: los que caen en la zona del esquinero y, si
    // lo que sobra no se puede llenar justo con anchos del catálogo, el siguiente también.
    const reemplazable = (o: Item) => o.origen === 'producto' && o.modulo?.tipo === tipoMod && !o.bloqueado && !o.grupo
    const quitar: Item[] = []
    let hasta = 0, viable = true
    for (const o of deVecina) {
      const [d0, d1] = dist(o)
      if (d0 >= eW - 0.5) {
        const g = hasta - eW
        const llena = g < 1 || suma(combinarAnchos(g, anchos)) >= g - 0.5
        if (llena || d0 > hasta + 1) break
      }
      if (!reemplazable(o) || quitar.length >= 4) { viable = false; break }
      quitar.push(o)
      hasta = Math.max(hasta, d1)
    }
    if (!viable || !quitar.length) continue

    const ids = new Set(quitar.map(o => o.id))
    esc.items = esc.items.filter(o => !ids.has(o.id))
    esc.items.push(nuevo)
    // Se llena lo que quedó de la vecina, desde el esquinero hacia afuera.
    let d = eW
    for (const w of hasta - eW >= 1 ? combinarAnchos(hasta - eW, anchos) : []) {
      const p = mapa.get(w)!
      esc.items.push(itemDeProducto(p, p.def!, esc, { ubicacion: vecina, s: vecinaAlFinal ? LA - d - w : d }))
      d += w
    }
    hechos.push({ vecina, reemplazados: quitar.length })
  }
  return hechos
}

export const useRender = create<Estado>((set, get) => ({
  escena: escenaInicial(),
  pasado: [],
  futuro: [],
  seleccion: null,
  arrastrando: false,
  capturando: false,
  paredDestino: 'fondo',
  panel: 'ambiente',
  vista: { camara: 'perspectiva', cotas: true, puertasAbiertas: false, techo: false, calidad: 'normal', imanes: true },
  proyecto: { nombre: 'Cocina nueva', cliente: '', email: '', telefono: '', estado: 'borrador' },
  presupuesto: { ...PRESUPUESTO_DEFAULT },
  sucio: false,
  catalogo: [],
  electros: [],
  envios: [],
  aviso: null,
  camaraVersion: 0,

  mutar: (fn, historia = true) => {
    const { escena, pasado } = get()
    // immer: solo se copia lo que cambia; el resto conserva su identidad y React
    // no vuelve a dibujar los muebles que no se tocaron.
    const sig = produce(escena, fn)
    if (sig === escena) return
    set(historia
      ? { escena: sig, pasado: [...pasado.slice(-MAX_HISTORIA), escena], futuro: [], sucio: true }
      : { escena: sig, sucio: true })
  },
  marcarHistoria: () => {
    const { escena, pasado } = get()
    // Si no cambió nada desde la última marca, no se apila un paso vacío.
    if (pasado[pasado.length - 1] === escena) return
    set({ pasado: [...pasado.slice(-MAX_HISTORIA), escena], futuro: [] })
  },
  deshacer: () => {
    const { pasado, escena, futuro } = get()
    if (!pasado.length) return
    set({ escena: pasado[pasado.length - 1], pasado: pasado.slice(0, -1), futuro: [escena, ...futuro], sucio: true })
  },
  rehacer: () => {
    const { pasado, escena, futuro } = get()
    if (!futuro.length) return
    set({ escena: futuro[0], futuro: futuro.slice(1), pasado: [...pasado, escena], sucio: true })
  },
  seleccionar: id => set(id ? { seleccion: id, panel: 'seleccion' } : { seleccion: null }),
  setVista: v => set({ vista: { ...get().vista, ...v } }),
  setPanel: panel => set({ panel }),
  setParedDestino: paredDestino => set({ paredDestino }),
  setArrastrando: arrastrando => set({ arrastrando }),
  setProyecto: p => set({ proyecto: { ...get().proyecto, ...p }, sucio: true }),
  setPresupuesto: fn => { const p = structuredClone(get().presupuesto); fn(p); set({ presupuesto: p, sucio: true }) },
  setCatalogo: catalogo => set({ catalogo, escena: sincronizarDisenos(get().escena, catalogo) }),
  setElectros: electros => set({ electros }),
  avisar: (texto, tipo = 'ok') => {
    set({ aviso: { texto, tipo } })
    setTimeout(() => { if (get().aviso?.texto === texto) set({ aviso: null }) }, 3500)
  },
  cargar: (escena, presupuesto, proyecto) =>
    set({ escena: sincronizarDisenos(normalizarEscena(escena), get().catalogo), presupuesto: normalizarPresupuesto(presupuesto), proyecto, pasado: [], futuro: [], seleccion: null, sucio: false, camaraVersion: get().camaraVersion + 1 }),
  nuevo: () => set({
    escena: escenaInicial(), presupuesto: { ...PRESUPUESTO_DEFAULT }, pasado: [], futuro: [], seleccion: null, sucio: false,
    proyecto: { nombre: 'Cocina nueva', cliente: '', email: '', telefono: '', estado: 'borrador' },
    camaraVersion: get().camaraVersion + 1,
  }),
  recentrarCamara: () => set({ camaraVersion: get().camaraVersion + 1 }),

  agregarProducto: p => {
    const { paredDestino } = get()
    if (p.combo) {
      const grupo = uid()
      const combo = p.combo
      // Corrimiento de cada pieza desde el inicio del combo: el de la ficha, o el bajo
      // al inicio y las alacenas una al lado de la otra.
      const pos = combo.posiciones ?? (() => { let s = 0; return combo.componentes.map((d, i) => { if (i === 0) return 0; const r = s; s += d.ancho; return r }) })()
      const anchoTotal = Math.max(...combo.componentes.map((d, i) => pos[i] + d.ancho))
      const nombrePieza = (i: number) => {
        const t = combo.componentes[i].tipo
        return i === 0 ? p.nombre : `${p.nombre} (${t === 'bajo' ? 'bajo' : t === 'alto' ? 'columna' : 'alacena'})`
      }
      get().mutar(esc => {
        const base = itemDeProducto(p, combo.componentes[0], esc, { grupo, componente: 0 })
        // El hueco se busca para el ancho total del combo.
        const prueba: Item = { ...base, modulo: { ...base.modulo!, ancho: anchoTotal } }
        const lugar = ubicarNuevo(esc, prueba, paredDestino)
        const ub: Item = { ...base, ubicacion: lugar.ubicacion, s: lugar.s + pos[0], x: lugar.x, z: lugar.z, rot: lugar.rot }
        esc.items.push(ub)
        combo.componentes.forEach((def, i) => {
          if (i === 0) return
          esc.items.push(itemDeProducto(p, def, esc, {
            grupo, componente: i, ubicacion: ub.ubicacion, s: lugar.s + pos[i],
            x: ub.x !== undefined ? ub.x + (pos[i] + def.ancho / 2) - (pos[0] + combo.componentes[0].ancho / 2) : undefined, z: ub.z, rot: ub.rot, precio: 0, cuentaEnPresupuesto: false,
            nombre: nombrePieza(i),
          }))
        })
        set({ seleccion: ub.id, panel: 'seleccion' })
      })
      return
    }
    if (!p.def) { get().avisar(`No pude deducir las medidas de "${p.nombre}"`, 'error'); return }
    get().mutar(esc => {
      const it = ubicarNuevo(esc, itemDeProducto(p, p.def!, esc), paredDestino)
      if (it.modulo?.tipo.startsWith('esquinero') && it.ubicacion !== 'libre') it.esquina = esquinaPorDefecto(it.ubicacion, it.s, largoPared(esc, it.ubicacion))
      esc.items.push(it)
      set({ seleccion: it.id, panel: 'seleccion' })
    })
  },

  agregarElectro: e => {
    const { paredDestino } = get()
    get().mutar(esc => {
      const electro = {
        tipo: e.tipo, ancho: e.ancho, alto: e.alto, profundidad: e.profundidad, acabado: e.acabado,
        empotrable: e.empotrable, marca: e.marca, modelo: e.modelo,
      }
      const base: Item = {
        id: uid(), origen: 'electro', electroId: e.id, nombre: `${e.marca === 'Genérico' ? '' : e.marca + ' '}${e.modelo}`.trim(),
        precio: e.precio ?? 0, cuentaEnPresupuesto: true, electro, ubicacion: 'fondo', s: 0,
        elevacion: elevacionPorDefecto(null, electro, esc.estandares),
      }
      // Anafes, bachas y hornos van sobre/dentro de un bajo: si hay uno elegido, se centran ahí.
      const sel = esc.items.find(i => i.id === get().seleccion)
      let it: Item
      if (sel && sel.ubicacion !== 'libre' && sel.modulo && ['anafe', 'bacha', 'horno'].includes(e.tipo)) {
        it = { ...base, ubicacion: sel.ubicacion, s: Math.max(0, sel.s + (sel.modulo.ancho - e.ancho) / 2) }
      } else {
        it = ubicarNuevo(esc, base, paredDestino)
      }
      // Bachas y anafes van centrados en la profundidad de la mesada: la grifería
      // queda sobre la mesada y no dentro de la pared.
      if (it.ubicacion !== 'libre' && (e.tipo === 'anafe' || e.tipo === 'bacha')) {
        it.separacion = Math.max(e.tipo === 'bacha' ? 8 : 4, Math.round((esc.estandares.profMesada - e.profundidad) / 2))
      }
      esc.items.push(it)
      set({ seleccion: it.id, panel: 'seleccion' })
    })
  },

  agregarGenerico: tipo => {
    const { paredDestino } = get()
    get().mutar(esc => {
      const est = esc.estandares
      const def = tipo === 'bajo'
        ? { tipo, ancho: 60, alto: est.alturaBajo, profundidad: est.profBajo, columnas: [{ tipo: 'puerta' as const }, { tipo: 'puerta' as const }] }
        : tipo === 'alacena'
          ? { tipo, ancho: 60, alto: 60, profundidad: est.profAlacena, columnas: [{ tipo: 'puerta' as const }, { tipo: 'puerta' as const }] }
          : { tipo, ancho: 60, alto: 200, profundidad: 58, columnas: [{ tipo: 'puerta' as const }] }
      const it = ubicarNuevo(esc, {
        id: uid(), origen: 'generico', nombre: `Módulo a medida (${tipo === 'bajo' ? 'bajo' : tipo === 'alacena' ? 'alacena' : 'columna'})`,
        precio: 0, cuentaEnPresupuesto: true, modulo: def, ubicacion: 'fondo', s: 0, elevacion: elevacionPorDefecto(def, null, est),
      }, paredDestino)
      esc.items.push(it)
      set({ seleccion: it.id, panel: 'seleccion' })
    })
  },

  agregarDeco: p => {
    const { paredDestino, seleccion } = get()
    get().mutar(esc => {
      const W = esc.ambiente.ancho, D = esc.ambiente.largo
      const pared: Pared = paredDestino !== 'libre' && esc.ambiente.paredes[paredDestino]
        ? paredDestino
        : (['fondo', 'izq', 'der', 'frente'] as Pared[]).find(x => esc.ambiente.paredes[x]) ?? 'fondo'
      const base: Item = {
        id: uid(), origen: 'deco', nombre: p.nombre, precio: 0, cuentaEnPresupuesto: false,
        deco: structuredClone(p.def), ubicacion: 'libre', s: 0, elevacion: p.elevacion ?? 0,
      }
      let it: Item
      const mesa = esc.items.find(i => i.deco && (i.deco.tipo === 'mesa-rect' || i.deco.tipo === 'mesa-redonda'))
      const centro = { x: Math.round(W / 2), z: Math.round(Math.min(D - 80, D / 2 + 30)) }
      if (p.modo === 'piso') {
        const t = p.def.tipo
        let pos = { ...centro }
        if ((t === 'alfombra' || t === 'colgante') && mesa) pos = { x: mesa.x ?? centro.x, z: mesa.z ?? centro.z }
        else if (t === 'planta') {
          // Primera esquina libre (empezando por las del frente, que suelen quedar vacías).
          const r = p.def.ancho / 2 + 8
          const esquinas = [{ x: r, z: D - r }, { x: W - r, z: D - r }, { x: r, z: r }, { x: W - r, z: r }]
          const libre = esquinas.find(e => !esc.items.some(o => {
            if (o.deco?.tipo === 'alfombra' || o.deco?.tipo === 'colgante') return false
            const c = caja(o, esc)
            return e.x + r > c.x0 && e.x - r < c.x1 && e.z + r > c.z0 && e.z - r < c.z1
          }))
          pos = libre ?? { x: centro.x + 60, z: centro.z }
        } else if (t !== 'mesa-rect' && t !== 'mesa-redonda' && t !== 'alfombra') {
          const n = esc.items.filter(i => i.deco && i.ubicacion === 'libre').length
          pos = { x: centro.x + ((n % 4) - 1.5) * 30, z: centro.z + 70 }
        }
        it = { ...base, x: Math.round(pos.x), z: Math.round(pos.z), rot: 0 }
      } else if (p.modo === 'pared') {
        // Primer tramo de pared libre a esa altura (muebles, aberturas y otros cuadros),
        // probando primero la pared elegida.
        const y0 = base.elevacion, y1 = base.elevacion + p.def.alto
        const w = p.def.ancho
        const orden = [pared, ...(['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(x => x !== pared && esc.ambiente.paredes[x])]
        let destino: { u: Pared; s: number } | null = null
        for (const u of orden) {
          const L = largoPared(esc, u)
          const occ: [number, number][] = []
          for (const o of esc.items) {
            if (o.ubicacion !== u) continue
            if (o.deco && (o.deco.tipo !== 'cuadro' && o.deco.tipo !== 'espejo' && o.deco.tipo !== 'reloj' && o.deco.tipo !== 'estante')) continue
            const c = caja(o, esc)
            if (c.y0 < y1 && y0 < c.y1) occ.push([o.s, o.s + medidas(o).ancho])
          }
          for (const ab of esc.ambiente.aberturas) if (ab.pared === u && ab.elevacion < y1 && y0 < ab.elevacion + ab.alto) occ.push([ab.s, ab.s + ab.ancho])
          // Esquinas: muebles de las paredes vecinas que llegan hasta esta.
          for (const o of esc.items) {
            if (o.ubicacion === u || o.ubicacion === 'libre' || o.deco) continue
            const c = caja(o, esc)
            if (!(c.y0 < y1 && y0 < c.y1)) continue
            if ((u === 'fondo' && c.z0 < 5) || (u === 'frente' && c.z1 > D - 5)) occ.push([c.x0, c.x1])
            if ((u === 'izq' && c.x0 < 5) || (u === 'der' && c.x1 > W - 5)) occ.push([c.z0, c.z1])
          }
          occ.sort((a, b) => a[0] - b[0])
          let cursor = 0, mejor: [number, number] | null = null
          for (const [a, b] of [...occ, [L, L] as [number, number]]) {
            if (a - cursor >= w + 20 && (!mejor || a - cursor > mejor[1] - mejor[0])) mejor = [cursor, a]
            cursor = Math.max(cursor, b)
          }
          if (mejor) { destino = { u, s: (mejor[0] + mejor[1] - w) / 2 }; break }
        }
        it = destino
          ? { ...base, ubicacion: destino.u, s: Math.round(destino.s) }
          : { ...base, ubicacion: pared, s: Math.max(0, (largoPared(esc, pared) - w) / 2) }
        if (!destino) setTimeout(() => get().avisar('No queda pared libre a esa altura: lo dejé en el centro, movelo o cambiá su altura'), 0)
      } else {
        // Sobre la mesada: primer lugar libre sobre los bajos de la pared
        // (empezando por el bajo seleccionado), sin pisar anafes, bachas ni otros adornos.
        const sel = esc.items.find(i => i.id === seleccion && i.modulo?.tipo === 'bajo' && i.ubicacion !== 'libre')
        const u = (sel?.ubicacion ?? pared) as Pared
        const bajos = esc.items.filter(i => i.ubicacion === u && i.modulo?.tipo === 'bajo').sort((a, b) => a.s - b.s)
        if (sel) bajos.sort((a, b) => (a.id === sel.id ? -1 : b.id === sel.id ? 1 : 0))
        const ocupado = esc.items
          .filter(o => o.ubicacion === u && ((o.deco && o.elevacion >= topeMesada(esc.estandares) - 1) || o.electro?.tipo === 'anafe' || o.electro?.tipo === 'bacha'))
          .map(o => [o.s - 3, o.s + medidas(o).ancho + 3] as [number, number])
        const w = p.def.ancho
        let s: number | null = null
        for (const b of bajos) {
          const fin = b.s + medidas(b).ancho - w
          for (let x = b.s + 5; x <= fin - 5 + 0.01; x += 5) {
            if (!ocupado.some(([a, z]) => x < z && x + w > a)) { s = x; break }
          }
          if (s !== null) break
        }
        if (s === null) s = bajos[0] ? bajos[0].s + (medidas(bajos[0]).ancho - w) / 2 : (largoPared(esc, u) - w) / 2
        it = { ...base, ubicacion: u, s: Math.max(0, s), elevacion: topeMesada(esc.estandares), separacion: p.separacion ?? 10 }
      }
      if (p.juego) {
        const grupo = uid()
        it.grupo = grupo
        esc.items.push(it)
        for (const j of p.juego) {
          esc.items.push({
            ...base, id: uid(), grupo, nombre: 'Silla', deco: structuredClone(j.def),
            x: (it.x ?? 0) + j.dx, z: (it.z ?? 0) + j.dz, rot: j.rot,
          })
        }
      } else {
        esc.items.push(it)
      }
      set({ seleccion: it.id, panel: 'seleccion' })
    })
  },

  moverItem: (id, s, imanes = true) => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it || it.ubicacion === 'libre') return
      const tope = Math.max(0, largoPared(esc, it.ubicacion) - medidas(it).ancho)
      const nuevo = imanes ? imantar(esc, it, s) : Math.round(Math.max(0, Math.min(tope, s)) * 10) / 10
      let delta = nuevo - it.s
      if (it.grupo) {
        // Combos: ninguna pieza del grupo puede salirse de la pared.
        const L = largoPared(esc, it.ubicacion)
        const grupo = esc.items.filter(o => o.grupo === it.grupo && o.ubicacion === it.ubicacion)
        const ini = Math.min(...grupo.map(o => o.s)), fin = Math.max(...grupo.map(o => o.s + medidas(o).ancho))
        delta = Math.max(-ini, Math.min(L - fin, delta))
      }
      if (!delta) return
      for (const o of esc.items) if (o.id === id || (it.grupo && o.grupo === it.grupo)) o.s += delta
    }, false)
  },

  moverLibre: (id, x, z) => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      const dx = Math.round(x) - (it.x ?? 0), dz = Math.round(z) - (it.z ?? 0)
      if (!dx && !dz) return
      for (const o of esc.items) if (o.id === id || (it.grupo && o.grupo === it.grupo)) { o.x = (o.x ?? 0) + dx; o.z = (o.z ?? 0) + dz }
    }, false)
  },

  cambiarUbicacion: (id, u) => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      const miembros = esc.items.filter(o => o.id === id || (it.grupo && o.grupo === it.grupo))
      if (u === 'libre') {
        if (it.ubicacion === 'libre') return
        const { cx, cz } = transformar(it, esc)
        const x0 = cx, z0 = Math.min(esc.ambiente.largo - 60, cz + 120)
        const centroLider = it.s + medidas(it).ancho / 2, profLider = medidas(it).prof
        for (const o of miembros) {
          const m = medidas(o)
          // A lo largo: mismo corrimiento que tenían en la pared. En profundidad: fondos alineados.
          o.x = Math.round(x0 + (o.s + m.ancho / 2 - centroLider))
          o.z = Math.round(z0 - (profLider - m.prof) / 2)
          o.rot = 0
          o.ubicacion = 'libre'
        }
        return
      }
      const origen = it.ubicacion === 'libre' ? (it.x ?? 0) : it.s
      const s = primerHueco(esc, { ...it, ubicacion: u }, u) ?? 0
      for (const o of miembros) {
        o.s = Math.max(0, s + ((it.ubicacion === 'libre' ? (o.x ?? 0) : o.s) - origen))
        o.ubicacion = u
        if (o.modulo?.tipo.startsWith('esquinero')) o.esquina = esquinaPorDefecto(u, o.s, largoPared(esc, u))
      }
    })
  },

  actualizarItem: (id, fn, historia = true) => get().mutar(esc => { const it = esc.items.find(i => i.id === id); if (it) fn(it) }, historia),

  duplicar: id => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      if (it.grupo) {
        // Combos y juegos: se copia el grupo completo, así el presupuesto suma un combo
        // entero y no quedan piezas sueltas con el precio del combo (o gratis).
        const piezas = esc.items.filter(o => o.grupo === it.grupo)
        const grupo = uid()
        const lider = piezas.find(o => o.cuentaEnPresupuesto) ?? piezas[0]
        const anchoGrupo = Math.max(...piezas.map(o => o.s + medidas(o).ancho)) - Math.min(...piezas.map(o => o.s))
        let ds = 0, dx = 0
        if (it.ubicacion === 'libre') dx = Math.max(...piezas.map(o => medidas(o).ancho)) + 60
        else {
          const prueba = { ...structuredClone(current(lider)), modulo: lider.modulo ? { ...current(lider).modulo!, ancho: anchoGrupo } : undefined } as Item
          const s = primerHueco(esc, prueba, it.ubicacion)
          ds = s === null ? 0 : s - Math.min(...piezas.map(o => o.s))
        }
        let nuevoId = ''
        for (const o of piezas) {
          const c: Item = { ...structuredClone(current(o)), id: uid(), grupo, s: o.s + ds, ...(o.ubicacion === 'libre' ? { x: (o.x ?? 0) + dx } : {}) }
          if (o.id === id) nuevoId = c.id
          esc.items.push(c)
        }
        set({ seleccion: nuevoId })
        return
      }
      const copia: Item = { ...structuredClone(current(it)), id: uid() }
      const ub = it.ubicacion === 'libre'
        ? { ...copia, x: (it.x ?? 0) + medidas(it).ancho + 5 }
        : (() => { const s = primerHueco(esc, copia, it.ubicacion); return s === null ? { ...copia, s: it.s } : { ...copia, s } })()
      esc.items.push(ub)
      set({ seleccion: ub.id })
    })
  },

  rotarItem: id => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it || it.ubicacion !== 'libre') return
      const px = it.x ?? 0, pz = it.z ?? 0
      for (const o of esc.items) {
        if (o.id !== id && !(it.grupo && o.grupo === it.grupo)) continue
        // 90° alrededor del ítem elegido: (dx, dz) → (dz, -dx), igual que gira el mueble.
        const dx = (o.x ?? 0) - px, dz = (o.z ?? 0) - pz
        o.x = Math.round(px + dz)
        o.z = Math.round(pz - dx)
        o.rot = (((o.rot ?? 0) + 90) % 360)
      }
    })
  },

  borrar: id => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      esc.items = esc.items.filter(o => !(o.id === id || (it.grupo && o.grupo === it.grupo)))
    })
    set({ seleccion: null })
  },

  /**
   * Llena los huecos libres de una pared con bajos y alacenas del catálogo,
   * eligiendo la combinación de anchos que menos espacio desperdicia.
   */
  autocompletar: pared => {
    const { catalogo } = get()
    const bajos = productoPorAncho(catalogo, 'bajo')
    const alacenas = productoPorAncho(catalogo, 'alacena', 60)
    // Esquineros del catálogo (el más barato de cada nivel, sin colores especiales).
    const esquineroDe = (tipo: 'esquinero-bajo' | 'esquinero-alto') => catalogo
      .filter(p => p.grupo === 'esquinero' && p.def?.tipo === tipo && !p.def.frente)
      .sort((a, b) => a.precio - b.precio)[0]
    let agregados = 0
    const esquinas: { vecina: Pared; reemplazados: number }[] = []
    get().mutar(esc => {
      for (const [mapa, tipoMod] of [[bajos, 'bajo'], [alacenas, 'alacena']] as const) {
        const anchos = [...mapa.keys()]
        if (!anchos.length) continue
        // Antes de llenar: si la pared vecina ya llega al rincón, va un esquinero.
        esquinas.push(...esquineroAutomatico(esc, pared, tipoMod, mapa, esquineroDe(tipoMod === 'bajo' ? 'esquinero-bajo' : 'esquinero-alto')))
        const muestra = mapa.get(anchos[0])!
        const prueba = itemDeProducto(muestra, muestra.def!, esc, { ubicacion: pared })
        // Huecos libres en esa banda de altura.
        const L = largoPared(esc, pared)
        const ocup: [number, number][] = []
        const c0 = caja({ ...prueba, s: 0 }, esc)
        for (const o of esc.items) {
          if (o.deco) continue // la decoración no ocupa lugar: se reacomoda después
          if (o.ubicacion !== pared && o.ubicacion !== 'libre') {
            // Muebles de paredes vecinas que invaden la esquina.
            const c = caja(o, esc)
            if (!(c.y0 < c0.y1 && c0.y0 < c.y1)) continue
            const p = medidas(prueba).prof
            if (pared === 'fondo' && c.z0 < p) ocup.push([c.x0, c.x1])
            if (pared === 'frente' && c.z1 > esc.ambiente.largo - p) ocup.push([c.x0, c.x1])
            if (pared === 'izq' && c.x0 < p) ocup.push([c.z0, c.z1])
            if (pared === 'der' && c.x1 > esc.ambiente.ancho - p) ocup.push([c.z0, c.z1])
            continue
          }
          if (o.ubicacion !== pared) continue
          const c = caja(o, esc)
          if (c.y0 < c0.y1 && c0.y0 < c.y1) ocup.push([o.s, o.s + medidas(o).ancho])
        }
        for (const ab of esc.ambiente.aberturas) {
          if (ab.pared === pared && c0.y0 < ab.elevacion + ab.alto && ab.elevacion < c0.y1) ocup.push([ab.s, ab.s + ab.ancho])
        }
        ocup.sort((a, b) => a[0] - b[0])
        const libres: [number, number][] = []
        let cursor = 0
        for (const [a, b] of ocup) { if (a - cursor >= 15) libres.push([cursor, a]); cursor = Math.max(cursor, b) }
        if (L - cursor >= 15) libres.push([cursor, L])
        for (const [a, b] of libres) {
          let s = a
          for (const w of combinarAnchos(b - a, anchos)) {
            const p = mapa.get(w)!
            esc.items.push(itemDeProducto(p, p.def!, esc, { ubicacion: pared, s }))
            s += w
            agregados++
          }
        }
      }
    })
    // Si el mueble seleccionado fue reemplazado por el esquinero, se deselecciona.
    if (!get().escena.items.some(i => i.id === get().seleccion)) set({ seleccion: null })
    if (esquinas.length) {
      const paredes = [...new Set(esquinas.map(e => NOMBRE_PARED[e.vecina].toLowerCase()))].join(' y ')
      const reemplazados = esquinas.reduce((a, e) => a + e.reemplazados, 0)
      get().avisar(`Puse ${esquinas.length === 1 ? 'un esquinero' : `${esquinas.length} esquineros`} en la esquina con la ${paredes} y reacomodé ${reemplazados} ${reemplazados === 1 ? 'módulo' : 'módulos'} de ahí${agregados ? `; agregué ${agregados} más en esta pared` : ''}. Ctrl+Z lo deshace.`)
    } else {
      get().avisar(agregados ? `Agregué ${agregados} módulos en la pared` : 'No quedan huecos para completar en esa pared', agregados ? 'ok' : 'error')
    }
  },
}))

/** Ítem seleccionado (o null). */
export const useSeleccionado = () => useRender(s => s.escena.items.find(i => i.id === s.seleccion) ?? null)
