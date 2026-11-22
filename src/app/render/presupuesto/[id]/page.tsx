import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { lineasPresupuesto, metrosMesada, totalesPresupuesto, PRESUPUESTO_DEFAULT, medidas } from '@/lib/render/escena'
import type { Escena, Presupuesto } from '@/lib/render/tipos'
import { formatPrice } from '@/lib/utils'
import Imprimir from './Imprimir'

export default async function PresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const p = await prisma.renderProyecto.findUnique({ where: { id } })
  if (!p) notFound()
  const esc = JSON.parse(p.datos) as Escena
  const pres: Presupuesto = { ...PRESUPUESTO_DEFAULT, ...JSON.parse(p.presupuesto || '{}') }
  const ids = [...new Set(esc.items.map(i => i.productoId).filter((x): x is number => !!x))]
  const productos = await prisma.producto.findMany({ where: { id: { in: ids } }, select: { id: true, precio: true, precioOferta: true } })
  const precios = new Map(productos.map(x => [x.id, x.precioOferta ?? x.precio]))
  const lineas = lineasPresupuesto(esc, precios, pres)
  const envio = pres.tipoEnvioId ? await prisma.tipoEnvio.findUnique({ where: { id: pres.tipoEnvioId } }) : null
  const metros = metrosMesada(esc)
  const t = totalesPresupuesto(lineas, pres, metros, envio?.costo ?? 0)
  const conf = await prisma.configuracion.findUnique({ where: { id: 1 } })
  const fecha = p.actualizadoEn
  const vence = new Date(fecha.getTime() + pres.validezDias * 86400000)
  const dims = (nombre: string) => {
    const it = esc.items.find(i => i.nombre === nombre && i.cuentaEnPresupuesto)
    if (!it) return ''
    const m = medidas(it)
    return `${m.ancho} × ${m.alto} × ${m.prof} cm`
  }

  return (
    <div className="min-h-screen bg-gris-fondo py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b-4 border-rojo-principal pb-4">
          <div>
            <Image src="/logo.png" alt="Mueble UNO" width={170} height={36} className="h-9 w-auto" />
            <p className="mt-2 text-xs text-gris-medio">{conf?.direccion}{conf?.telefono ? ` · ${conf.telefono}` : ''}{conf?.email ? ` · ${conf.email}` : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold uppercase tracking-wide">Presupuesto</p>
            <p className="text-sm text-gris-medio">N.º R-{String(p.id).padStart(4, '0')}</p>
            <p className="text-sm text-gris-medio">{fecha.toLocaleDateString('es-AR')}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-gris-medio">Cliente</p>
            <p className="font-semibold">{p.cliente || '—'}</p>
            <p>{p.email}</p>
            <p>{p.telefono}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gris-medio">Proyecto</p>
            <p className="font-semibold">{p.nombre}</p>
            <p>Ambiente {esc.ambiente.ancho} × {esc.ambiente.largo} cm</p>
          </div>
        </div>

        {p.captura && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.captura} alt="Vista 3D de la cocina" className="mb-6 w-full rounded-lg border border-gray-100" />
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gris-oscuro text-left text-xs uppercase text-gris-medio">
              <th className="py-2">Cant.</th><th>Descripción</th><th className="text-right">Unitario</th><th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineas.filter(l => l.incluido).map(l => (
              <tr key={l.clave}>
                <td className="py-2 align-top font-semibold">{l.cantidad}</td>
                <td className="py-2">{l.nombre}<span className="block text-xs text-gris-claro">{dims(l.nombre)}</span></td>
                <td className="py-2 text-right align-top tabular-nums">{formatPrice(l.precio)}</td>
                <td className="py-2 text-right align-top tabular-nums">{formatPrice(l.subtotal)}</td>
              </tr>
            ))}
            {t.mesada > 0 && (
              <tr><td className="py-2 font-semibold">{metros}</td><td>Mesada {esc.materiales.mesada.nombre} (metro lineal)</td><td className="text-right tabular-nums">{formatPrice(pres.precioMesadaMl)}</td><td className="text-right tabular-nums">{formatPrice(t.mesada)}</td></tr>
            )}
            {pres.extras.map(e => (
              <tr key={e.id}><td className="py-2 font-semibold">{e.cantidad}</td><td>{e.concepto}</td><td className="text-right tabular-nums">{formatPrice(e.precioUnitario)}</td><td className="text-right tabular-nums">{formatPrice(e.cantidad * e.precioUnitario)}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPrice(t.subtotal)}</span></div>
          {t.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento {pres.descuentoPct}%</span><span className="tabular-nums">-{formatPrice(t.descuento)}</span></div>}
          {t.envio > 0 && <div className="flex justify-between"><span>Envío ({envio?.nombre})</span><span className="tabular-nums">{formatPrice(t.envio)}</span></div>}
          <div className="flex justify-between border-t-2 border-gris-oscuro pt-2 text-lg font-bold"><span>Total</span><span className="tabular-nums text-rojo-principal">{formatPrice(t.total)}</span></div>
        </div>

        <div className="mt-8 space-y-1 border-t border-gray-100 pt-4 text-xs text-gris-medio">
          <p><strong>Colores:</strong> frentes {esc.materiales.frentes.nombre}, cuerpos {esc.materiales.cuerpos.nombre}, mesada {esc.materiales.mesada.nombre}.</p>
          {pres.notas && <p className="whitespace-pre-line">{pres.notas}</p>}
          <p>Presupuesto válido hasta el {vence.toLocaleDateString('es-AR')}. Precios sujetos a confirmación de medidas en obra. Los muebles se entregan armados.</p>
          {lineas.some(l => l.tipo === 'electro' && !l.incluido) && <p>Los electrodomésticos se muestran como referencia de medidas y no están incluidos.</p>}
        </div>
      </div>
      <Imprimir />
    </div>
  )
}
