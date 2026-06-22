import { prisma } from './prisma'

export interface PedidoItemDetalle {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  slug?: string
}

const parseItems = (s: string): { productoId: number; cantidad: number; nombre?: string; precio?: number }[] => {
  try { return JSON.parse(s) || [] } catch { return [] }
}

/**
 * Trae pedidos con su tipo de envío y resuelve nombre/precio de cada item
 * desde la DB (los pedidos de Nave guardan sólo {productoId, cantidad}).
 * Compartido entre el Dashboard y la página de Pedidos.
 */
export async function getPedidosEnriquecidos(opts?: { take?: number }) {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { tipoEnvio: true },
    ...(opts?.take ? { take: opts.take } : {}),
  })

  const allIds = [...new Set(pedidos.flatMap(p => parseItems(p.items).map(i => i.productoId)))].filter(Boolean)
  const productos = allIds.length
    ? await prisma.producto.findMany({
        where: { id: { in: allIds } },
        select: { id: true, nombre: true, precio: true, precioOferta: true, slug: true },
      })
    : []
  const pmap = new Map(productos.map(p => [p.id, p]))

  return pedidos.map(p => ({
    ...p,
    itemsDetalle: parseItems(p.items).map(i => {
      const prod = pmap.get(i.productoId)
      return {
        productoId: i.productoId,
        nombre: i.nombre ?? prod?.nombre ?? `Producto #${i.productoId}`,
        cantidad: i.cantidad,
        precio: i.precio ?? prod?.precioOferta ?? prod?.precio ?? 0,
        slug: prod?.slug,
      }
    }),
  }))
}
