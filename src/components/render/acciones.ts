'use client'
import { lineasPresupuesto, metrosMesada, totalesPresupuesto } from '@/lib/render/escena'
import { capturador } from './Escena3D'
import { useRender } from './store'

/** Totales del presupuesto con los precios vigentes del catálogo. */
export function calcularPresupuesto() {
  const { escena, presupuesto, catalogo, envios } = useRender.getState()
  const precios = new Map(catalogo.map(p => [p.id, p.precio]))
  const lineas = lineasPresupuesto(escena, precios, presupuesto)
  const envio = envios.find(e => e.id === presupuesto.tipoEnvioId)?.costo ?? 0
  const metros = metrosMesada(escena)
  return { lineas, metros, totales: totalesPresupuesto(lineas, presupuesto, metros, envio) }
}

const cuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

/** Captura sin cotas ni contornos de selección. */
async function capturaLimpia(escala = 1, tipo: 'png' | 'jpeg' = 'jpeg'): Promise<string | undefined> {
  if (!capturador.fn) return undefined
  useRender.setState({ capturando: true })
  await cuadro()
  const url = capturador.fn(escala, tipo, 0.85)
  useRender.setState({ capturando: false })
  return url
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

export async function guardarProyecto(estado?: 'borrador' | 'presupuesto'): Promise<number | null> {
  const st = useRender.getState()
  const { totales } = calcularPresupuesto()
  const cruda = await capturaLimpia()
  const captura = cruda ? await reducir(cruda) : undefined
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
  if (!r.ok) { st.avisar(j.error ?? 'No se pudo guardar', 'error'); return null }
  const nuevoId = id ?? j.id
  useRender.setState(s => ({
    proyecto: { ...s.proyecto, id: nuevoId, estado: s.proyecto.estado === 'venta' ? 'venta' : body.estado as 'borrador' | 'presupuesto' },
    sucio: false,
  }))
  if (!id) window.history.replaceState(null, '', `/render?p=${nuevoId}`)
  st.avisar('Proyecto guardado')
  return nuevoId
}

export async function descargarImagen() {
  const url = await capturaLimpia(2, 'png')
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `${useRender.getState().proyecto.nombre.replace(/[^\w\s-]/g, '').trim() || 'cocina'}.png`
  a.click()
}
