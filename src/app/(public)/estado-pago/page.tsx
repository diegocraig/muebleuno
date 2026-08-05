import Link from 'next/link'
import { CheckCircle, Clock, XCircle, RotateCcw, HelpCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { displayPedidoId } from '@/lib/utils'
import AutoRefresh from './AutoRefresh'
import PixelPurchase from './PixelPurchase'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ pedido?: string }>
}

// Estados que escribe el webhook de Nave (ver src/app/api/nave/webhook/route.ts):
// pagado | rechazado | cancelado | devuelto | pendiente
type Vista = 'pagado' | 'pendiente' | 'fallido' | 'devuelto' | 'desconocido'

function clasificar(estado: string | undefined, encontrado: boolean): Vista {
  if (!encontrado) return 'desconocido'
  switch (estado) {
    case 'pagado':
      return 'pagado'
    case 'rechazado':
    case 'cancelado':
      return 'fallido'
    case 'devuelto':
      return 'devuelto'
    case 'pendiente':
      return 'pendiente'
    default:
      return 'desconocido'
  }
}

export default async function EstadoPagoPage({ searchParams }: PageProps) {
  const { pedido: pedidoParam } = await searchParams
  const pedidoId = parseInt(pedidoParam ?? '')

  const pedido = Number.isNaN(pedidoId)
    ? null
    : await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { id: true, estado: true, total: true, items: true },
      })

  const vista = clasificar(pedido?.estado, pedido !== null)

  // Datos para el evento Purchase del Pixel (solo si el pago está confirmado).
  let compra: { contentIds: string[]; cantidad: number } | null = null
  if (pedido && vista === 'pagado') {
    try {
      const items = JSON.parse(pedido.items || '[]') as { productoId?: number; cantidad?: number }[]
      compra = {
        contentIds: items.map(i => String(i.productoId)).filter(id => id !== 'undefined'),
        cantidad: items.reduce((n, i) => n + (i.cantidad ?? 1), 0),
      }
    } catch {
      compra = { contentIds: [], cantidad: 1 }
    }
  }

  const config = {
    pagado: {
      icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />,
      titulo: '¡Pago recibido!',
      texto: 'Tu pedido fue confirmado. Nos contactaremos a la brevedad para coordinar la entrega.',
    },
    pendiente: {
      icon: <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />,
      titulo: 'Estamos confirmando tu pago',
      texto: 'El pago se está procesando. Esta página se actualiza sola; en cuanto se confirme verás la novedad acá. Podés cerrar esta ventana y te contactaremos igual.',
    },
    fallido: {
      icon: <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />,
      titulo: 'El pago no se completó',
      texto: 'No pudimos procesar el pago (fue rechazado o cancelado). No se te realizó ningún cargo. Podés intentarlo de nuevo desde la tienda.',
    },
    devuelto: {
      icon: <RotateCcw className="w-16 h-16 text-gris-medio mx-auto mb-4" />,
      titulo: 'Pago devuelto',
      texto: 'Este pago fue reintegrado. Si tenés alguna duda, escribinos a ventas@muebleuno.com.',
    },
    desconocido: {
      icon: <HelpCircle className="w-16 h-16 text-gris-medio mx-auto mb-4" />,
      titulo: 'No encontramos tu pedido',
      texto: 'No pudimos identificar el estado de este pago. Si ya pagaste, escribinos a ventas@muebleuno.com y lo verificamos.',
    },
  }[vista]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gris-fondo px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {vista === 'pendiente' && <AutoRefresh />}
        {pedido && compra && (
          <PixelPurchase
            pedidoId={pedido.id}
            total={pedido.total}
            contentIds={compra.contentIds}
            cantidad={compra.cantidad}
          />
        )}
        {config.icon}
        <h1 className="text-2xl font-black mb-2">{config.titulo}</h1>
        <p className="text-gris-medio mb-6">{config.texto}</p>

        {pedido && (
          <p className="text-sm text-gris-medio mb-6">
            Pedido <span className="font-bold">#{displayPedidoId(pedido.id)}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          {vista === 'fallido' && (
            <Link
              href="/productos"
              className="inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Volver a la tienda e intentar de nuevo
            </Link>
          )}
          <Link
            href="/"
            className={
              vista === 'fallido'
                ? 'inline-block text-gris-medio hover:text-rojo-principal font-medium transition-colors'
                : 'inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-8 py-3 rounded-lg transition-colors'
            }
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
