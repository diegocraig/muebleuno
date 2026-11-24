'use client'
import { lineasPresupuesto, metrosMesada, totalesPresupuesto } from '@/lib/render/escena'
import type { DatosProyecto, Escena, Presupuesto } from '@/lib/render/tipos'
import { capturador } from './Escena3D'
import { useRender } from './store'

/** Totales del presupuesto con los precios vigentes del catálogo. */
export function calcularPresupuesto() {
  const { escena, presupuesto, catalogo, envios } = useRender.getState()
  const refs = new Map(catalogo.map(p => [p.id, { precio: p.precio, def: p.def, combo: p.combo }]))
  const lineas = lineasPresupuesto(escena, refs, presupuesto)
  const envio = envios.find(e => e.id === presupuesto.tipoEnvioId)?.costo ?? 0
  const metros = metrosMesada(escena)
  return { lineas, metros, totales: totalesPresupuesto(lineas, presupuesto, metros, envio) }
}

const cuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

/** Captura sin cotas ni contornos de selección. */
async function capturaLimpia(escala = 1, tipo: 'png' | 'jpeg' = 'jpeg'): Promise<string | undefined> {
  if (!capturador.fn) return undefined
  useRender.setState({ capturando: true })
  try {
    await cuadro()
    return capturador.fn?.(escala, tipo, 0.85)
  } finally {
    useRender.setState({ capturando: false })
  }
}

async function reducir(url: string, ancho = 900): Promise<string> {
  const img = new Image()
  img.src = url
  await img.decode()
  const k = Math.min(1, ancho / img.width)
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k)
  c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.8)
}

// ─── Borrador automático (localStorage) ─────────────────────────────────────

/** Un borrador por proyecto (y uno para "proyecto nuevo"): abrir otro no lo pisa. */
const claveBorrador = (id?: number | null) => `muebleuno-render-borrador-${id ?? 'nuevo'}`

export interface Borrador { fecha: string; proyecto: DatosProyecto; escena: Escena; presupuesto: Presupuesto }

export function guardarBorrador() {
  try {
    const { proyecto, escena, presupuesto, sucio } = useRender.getState()
    if (!sucio) return
    const b: Borrador = { fecha: new Date().toISOString(), proyecto, escena, presupuesto }
    localStorage.setItem(claveBorrador(proyecto.id), JSON.stringify(b))
  } catch { /* sin espacio o modo privado: el borrador es solo una red de seguridad */ }
}

export function leerBorrador(id?: number | null): Borrador | null {
  try {
    const b = JSON.parse(localStorage.getItem(claveBorrador(id)) ?? 'null') as Borrador | null
    return b && b.escena && Array.isArray(b.escena.items) && b.proyecto ? b : null
  } catch { return null }
}

export function borrarBorrador(id?: number | null) {
  try { localStorage.removeItem(claveBorrador(id)) } catch { /* nada */ }
}

// ─── Guardar ────────────────────────────────────────────────────────────────

/** Un solo guardado a la vez (botón, Ctrl+S, "ver presupuesto" y venta comparten el candado). */
let guardadoEnCurso: Promise<number | null> | null = null

export function guardarProyecto(estado?: 'borrador' | 'presupuesto'): Promise<number | null> {
  if (guardadoEnCurso) return guardadoEnCurso
  guardadoEnCurso = guardar(estado).finally(() => { guardadoEnCurso = null })
  return guardadoEnCurso
}

async function guardar(estado?: 'borrador' | 'presupuesto'): Promise<number | null> {
  const st = useRender.getState()
  try {
    const { totales } = calcularPresupuesto()
    const cruda = await capturaLimpia().catch(() => undefined)
    const captura = cruda ? await reducir(cruda).catch(() => undefined) : undefined
    const body = {
      ...st.proyecto,
      estado: estado ?? (st.proyecto.estado === 'venta' ? 'presupuesto' : st.proyecto.estado),
      datos: st.escena,
      presupuesto: st.presupuesto,
      total: totales.total,
      captura,
    }
    const id = st.proyecto.id
    const r = await fetch(id ? `/api/render/proyectos/${id}` : '/api/render/proyectos', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      st.avisar(r.status === 401 ? 'La sesión venció: volvé a entrar al panel en otra pestaña y guardá de nuevo' : (j.error ?? 'No se pudo guardar'), 'error')
      return null
    }
    const nuevoId: number = id ?? j.id
    // Si se siguió editando mientras se guardaba, eso todavía no viajó: queda "sin guardar".
    const ahora = useRender.getState()
    const sinCambios = ahora.escena === st.escena && ahora.presupuesto === st.presupuesto
      && ahora.proyecto.nombre === st.proyecto.nombre && ahora.proyecto.cliente === st.proyecto.cliente
      && ahora.proyecto.email === st.proyecto.email && ahora.proyecto.telefono === st.proyecto.telefono
    useRender.setState(s => ({
      proyecto: { ...s.proyecto, id: nuevoId, estado: s.proyecto.estado === 'venta' ? 'venta' : body.estado as 'borrador' | 'presupuesto' },
      sucio: !sinCambios,
    }))
    borrarBorrador(id)
    if (!id) { borrarBorrador(null); window.history.replaceState(null, '', `/render?p=${nuevoId}`) }
    st.avisar('Proyecto guardado')
    return nuevoId
  } catch {
    st.avisar('No se pudo guardar: revisá la conexión e intentá de nuevo', 'error')
    return null
  }
}

export async function descargarImagen() {
  const url = await capturaLimpia(2, 'png')
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `${useRender.getState().proyecto.nombre.replace(/[^\w\s-]/g, '').trim() || 'cocina'}.png`
  a.click()
}
