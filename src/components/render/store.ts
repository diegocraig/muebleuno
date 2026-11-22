'use client'
import { create } from 'zustand'
import type {
  DatosProyecto, ElectroCatalogo, Escena, Item, Pared, Presupuesto, ProductoCatalogo, TipoEnvioOpcion, Ubicacion,
} from '@/lib/render/tipos'
import {
  caja, combinarAnchos, elevacionPorDefecto, esquinaPorDefecto, escenaInicial, imantar, largoPared, medidas, PRESUPUESTO_DEFAULT,
  primerHueco, productoPorAncho, topeMesada, transformar, uid,
} from '@/lib/render/escena'
import { preset } from '@/lib/render/materiales'
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
  actualizarItem: (id: string, fn: (it: Item) => void) => void
  duplicar: (id: string) => void
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
    const sig = structuredClone(escena)
    fn(sig)
    set(historia
      ? { escena: sig, pasado: [...pasado.slice(-MAX_HISTORIA), escena], futuro: [], sucio: true }
      : { escena: sig, sucio: true })
  },
  marcarHistoria: () => {
    const { escena, pasado } = get()
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
  setCatalogo: catalogo => set({ catalogo }),
  setElectros: electros => set({ electros }),
  avisar: (texto, tipo = 'ok') => {
    set({ aviso: { texto, tipo } })
    setTimeout(() => { if (get().aviso?.texto === texto) set({ aviso: null }) }, 3500)
  },
  cargar: (escena, presupuesto, proyecto) =>
    set({ escena, presupuesto: { ...PRESUPUESTO_DEFAULT, ...presupuesto }, proyecto, pasado: [], futuro: [], seleccion: null, sucio: false, camaraVersion: get().camaraVersion + 1 }),
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
      get().mutar(esc => {
        const base = itemDeProducto(p, p.combo!.componentes[0], esc, { grupo })
        const ub = ubicarNuevo(esc, base, paredDestino)
        esc.items.push(ub)
        let s = ub.s
        p.combo!.componentes.slice(1).forEach(def => {
          esc.items.push(itemDeProducto(p, def, esc, {
            grupo, ubicacion: ub.ubicacion, s, x: ub.x, z: ub.z, rot: ub.rot, precio: 0, cuentaEnPresupuesto: false,
            nombre: `${p.nombre} (alacena)`,
          }))
          s += def.ancho
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
        it = { ...base, ubicacion: sel.ubicacion, s: sel.s + (sel.modulo.ancho - e.ancho) / 2 }
      } else {
        it = ubicarNuevo(esc, base, paredDestino)
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
      const nuevo = imanes ? imantar(esc, it, s) : Math.round(s * 10) / 10
      const delta = nuevo - it.s
      for (const o of esc.items) if (o.id === id || (it.grupo && o.grupo === it.grupo)) o.s += delta
    }, false)
  },

  moverLibre: (id, x, z) => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      const dx = Math.round(x) - (it.x ?? 0), dz = Math.round(z) - (it.z ?? 0)
      for (const o of esc.items) if (o.id === id || (it.grupo && o.grupo === it.grupo)) { o.x = (o.x ?? 0) + dx; o.z = (o.z ?? 0) + dz }
    }, false)
  },

  cambiarUbicacion: (id, u) => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      const miembros = esc.items.filter(o => o.id === id || (it.grupo && o.grupo === it.grupo))
      if (u === 'libre') {
        const { cx, cz } = transformar(it, esc)
        for (const o of miembros) { o.ubicacion = 'libre'; o.x = cx; o.z = Math.min(esc.ambiente.largo - 60, cz + 120); o.rot = 0 }
        return
      }
      const s = primerHueco(esc, { ...it, ubicacion: u }, u) ?? 0
      for (const o of miembros) { o.ubicacion = u; o.s = s + (o.s - it.s) }
    })
  },

  actualizarItem: (id, fn) => get().mutar(esc => { const it = esc.items.find(i => i.id === id); if (it) fn(it) }),

  duplicar: id => {
    get().mutar(esc => {
      const it = esc.items.find(i => i.id === id)
      if (!it) return
      const copia: Item = { ...structuredClone(it), id: uid(), grupo: undefined, cuentaEnPresupuesto: it.origen === 'deco' ? it.cuentaEnPresupuesto : it.origen !== 'producto' || it.precio > 0 ? true : it.cuentaEnPresupuesto }
      if (copia.origen === 'producto' && copia.precio === 0) {
        // Parte de un combo duplicada suelta: no tiene precio propio.
        copia.cuentaEnPresupuesto = false
      }
      const ub = it.ubicacion === 'libre'
        ? { ...copia, x: (it.x ?? 0) + medidas(it).ancho + 5 }
        : (() => { const s = primerHueco(esc, copia, it.ubicacion); return s === null ? { ...copia, s: it.s } : { ...copia, s } })()
      esc.items.push(ub)
      set({ seleccion: ub.id })
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
    let agregados = 0
    get().mutar(esc => {
      for (const [mapa] of [[bajos], [alacenas]] as const) {
        const anchos = [...mapa.keys()]
        if (!anchos.length) continue
        const muestra = mapa.get(anchos[0])!
        const prueba = itemDeProducto(muestra, muestra.def!, esc, { ubicacion: pared })
        // Huecos libres en esa banda de altura.
        const L = largoPared(esc, pared)
        const ocup: [number, number][] = []
        const c0 = caja({ ...prueba, s: 0 }, esc)
        for (const o of esc.items) {
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
    get().avisar(agregados ? `Agregué ${agregados} módulos en la pared` : 'No quedan huecos para completar en esa pared', agregados ? 'ok' : 'error')
  },
}))

/** Ítem seleccionado (o null). */
export const useSeleccionado = () => useRender(s => s.escena.items.find(i => i.id === s.seleccion) ?? null)
