'use client'
import { useState } from 'react'
import { FileText, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { uid } from '@/lib/render/escena'
import { formatPrice, displayPedidoId } from '@/lib/utils'
import { useRender } from './store'
import { calcularPresupuesto, guardarProyecto } from './acciones'
import { Boton, Fila, Interruptor, Numero, Seccion, Selector } from './ui'

export default function PanelPresupuesto() {
  // Suscribirse a lo que cambia el cálculo.
  useRender(s => s.escena.items)
  const pres = useRender(s => s.presupuesto)
  const proyecto = useRender(s => s.proyecto)
  const envios = useRender(s => s.envios)
  const setPres = useRender(s => s.setPresupuesto)
  const setProyecto = useRender(s => s.setProyecto)
  const avisar = useRender(s => s.avisar)
  const sucio = useRender(s => s.sucio)
  const [vendiendo, setVendiendo] = useState(false)
  const { lineas, metros, totales } = calcularPresupuesto()
  const incluidas = lineas.filter(l => l.incluido)
  const electros = lineas.filter(l => l.tipo === 'electro')

  const generarVenta = async () => {
    if (!proyecto.cliente || !proyecto.email || !proyecto.telefono) { avisar('Completá nombre, email y teléfono del cliente', 'error'); return }
    if (!incluidas.some(l => l.tipo === 'producto')) { avisar('El presupuesto no tiene productos del catálogo', 'error'); return }
    if (!confirm(`Se va a crear un pedido "pendiente" en el panel por ${formatPrice(totales.total)} a nombre de ${proyecto.cliente}.\n\n¿Continuar?`)) return
    const avisarMail = confirm('¿Mandar también el aviso por mail a ventas?\n\nAceptar = sí · Cancelar = crear el pedido sin mail')
    setVendiendo(true)
    try {
      const id = await guardarProyecto('presupuesto')
      if (!id) return
      const r = await fetch(`/api/render/proyectos/${id}/venta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avisar: avisarMail }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { avisar(j.error ?? 'No se pudo generar la venta', 'error'); return }
      useRender.setState(s => ({ proyecto: { ...s.proyecto, estado: 'venta', pedidoId: j.pedidoId } }))
      // El servidor recalcula con los precios de la base: si difiere de lo que se veía, se avisa.
      avisar(j.total !== totales.total
        ? `Pedido #${displayPedidoId(j.pedidoId)} creado por ${formatPrice(j.total)} (los precios cambiaron desde que abriste el proyecto)`
        : `Pedido #${displayPedidoId(j.pedidoId)} creado`)
    } catch {
      avisar('No se pudo generar la venta: revisá la conexión', 'error')
    } finally {
      setVendiendo(false)
    }
  }

  const verPresupuesto = async () => {
    const id = sucio || !proyecto.id ? await guardarProyecto('presupuesto') : proyecto.id
    if (id) window.open(`/render/presupuesto/${id}`, '_blank')
  }

  return (
    <div className="pb-6">
      <Seccion titulo="Cliente">
        {(['cliente', 'email', 'telefono'] as const).map(k => (
          <input key={k} value={proyecto[k]} onChange={e => setProyecto({ [k]: e.target.value })}
            placeholder={k === 'cliente' ? 'Nombre y apellido' : k === 'email' ? 'Email' : 'Teléfono'}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-rojo-principal focus:outline-none" />
        ))}
      </Seccion>

      <Seccion titulo={`Muebles (${incluidas.filter(l => l.tipo !== 'electro').reduce((a, l) => a + l.cantidad, 0)})`}>
        {lineas.filter(l => l.tipo !== 'electro').length === 0 && <p className="text-xs text-gris-claro">Agregá muebles desde el catálogo.</p>}
        <ul className="divide-y divide-gray-100 text-sm">
          {lineas.filter(l => l.tipo !== 'electro').map(l => (
            <li key={l.clave} className="flex items-start justify-between gap-2 py-1.5">
              <span className="min-w-0"><span className="font-semibold text-gris-oscuro">{l.cantidad}×</span> {l.nombre}
                {l.precio === 0 && <span className="ml-1 text-xs text-amber-600">(sin precio)</span>}</span>
              <span className="shrink-0 tabular-nums">{formatPrice(l.subtotal)}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {electros.length > 0 && (
        <Seccion titulo="Electrodomésticos" accion={<span className="flex items-center gap-1 text-xs text-gris-medio">Incluir <Interruptor valor={pres.incluirElectros} onCambio={v => setPres(p => { p.incluirElectros = v })} /></span>}>
          <ul className="text-sm text-gris-medio">
            {electros.map(l => (
              <li key={l.clave} className="flex justify-between gap-2 py-0.5">
                <span>{l.cantidad}× {l.nombre}</span>
                <span className="tabular-nums">{l.precio ? formatPrice(l.subtotal) : '—'}</span>
              </li>
            ))}
          </ul>
          {!pres.incluirElectros && <p className="text-xs text-gris-claro">Se muestran como referencia de medidas; no suman al total.</p>}
        </Seccion>
      )}

      <Seccion titulo="Mesada">
        <Fila etiqueta={`Cobrar por metro (${metros} m)`}><Interruptor valor={pres.mesadaPorMetro} onCambio={v => setPres(p => { p.mesadaPorMetro = v })} /></Fila>
        {pres.mesadaPorMetro && <Fila etiqueta="Precio por metro lineal"><Numero valor={pres.precioMesadaMl} min={0} sufijo="$" ancho="w-28" onCambio={v => setPres(p => { p.precioMesadaMl = v })} /></Fila>}
      </Seccion>

      <Seccion titulo="Extras" accion={
        <button type="button" className="text-xs font-semibold text-rojo-principal" onClick={() => setPres(p => { p.extras.push({ id: uid(), concepto: 'Instalación', cantidad: 1, precioUnitario: 0 }) })}>
          <Plus className="inline h-3 w-3" /> agregar
        </button>
      }>
        {pres.extras.map((e, i) => (
          <div key={e.id} className="flex items-center gap-1">
            <input value={e.concepto} onChange={ev => setPres(p => { p.extras[i].concepto = ev.target.value })} className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-rojo-principal focus:outline-none" />
            <Numero valor={e.cantidad} min={0} sufijo="" ancho="w-12" onCambio={v => setPres(p => { p.extras[i].cantidad = v })} />
            <Numero valor={e.precioUnitario} min={0} sufijo="" ancho="w-24" onCambio={v => setPres(p => { p.extras[i].precioUnitario = v })} />
            <button type="button" onClick={() => setPres(p => { p.extras.splice(i, 1) })} className="p-1 text-gris-claro hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {!pres.extras.length && <p className="text-xs text-gris-claro">Instalación, flete especial, griferías, bachas…</p>}
      </Seccion>

      <Seccion titulo="Condiciones">
        <Fila etiqueta="Envío">
          <Selector valor={String(pres.tipoEnvioId ?? '')} opciones={[{ valor: '', texto: 'Sin envío / retira' }, ...envios.map(e => ({ valor: String(e.id), texto: `${e.nombre} (${formatPrice(e.costo)})` }))]} onCambio={v => setPres(p => { p.tipoEnvioId = v ? Number(v) : null })} className="max-w-[170px]" />
        </Fila>
        <Fila etiqueta="Descuento"><Numero valor={pres.descuentoPct} min={0} max={100} sufijo="%" ancho="w-16" onCambio={v => setPres(p => { p.descuentoPct = v })} /></Fila>
        <Fila etiqueta="Validez"><Numero valor={pres.validezDias} min={1} max={90} sufijo="días" ancho="w-16" onCambio={v => setPres(p => { p.validezDias = v })} /></Fila>
        <textarea value={pres.notas} onChange={e => setPres(p => { p.notas = e.target.value })} placeholder="Notas para el cliente (aparecen en el presupuesto)" rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-rojo-principal focus:outline-none" />
      </Seccion>

      <div className="space-y-1 px-4 py-3 text-sm">
        <div className="flex justify-between text-gris-medio"><span>Productos</span><span className="tabular-nums">{formatPrice(totales.productos)}</span></div>
        {totales.mesada > 0 && <div className="flex justify-between text-gris-medio"><span>Mesada</span><span className="tabular-nums">{formatPrice(totales.mesada)}</span></div>}
        {totales.extras > 0 && <div className="flex justify-between text-gris-medio"><span>Extras</span><span className="tabular-nums">{formatPrice(totales.extras)}</span></div>}
        {totales.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento</span><span className="tabular-nums">-{formatPrice(totales.descuento)}</span></div>}
        {totales.envio > 0 && <div className="flex justify-between text-gris-medio"><span>Envío</span><span className="tabular-nums">{formatPrice(totales.envio)}</span></div>}
        <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold"><span>Total</span><span className="tabular-nums text-rojo-principal">{formatPrice(totales.total)}</span></div>
      </div>

      <div className="space-y-2 px-4">
        <Boton className="w-full" onClick={verPresupuesto}><FileText className="h-4 w-4" /> Ver / imprimir presupuesto</Boton>
        {proyecto.pedidoId
          ? <a href="/admin/pedidos" target="_blank" className="block rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700">Venta generada: pedido #{displayPedidoId(proyecto.pedidoId)} →</a>
          : <Boton variante="primario" className="w-full" onClick={generarVenta} deshabilitado={vendiendo}><ShoppingBag className="h-4 w-4" /> {vendiendo ? 'Generando…' : 'Generar venta (pedido)'}</Boton>}
      </div>
    </div>
  )
}
