import { prisma } from '@/lib/prisma'
import PedidosAdmin from '@/components/admin/PedidosAdmin'

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { tipoEnvio: true },
  })

  // Los pedidos de Nave guardan sólo {productoId, cantidad}; resolvemos nombre
  // y precio desde la DB para mostrar el detalle completo en el admin.
  const parse = (s: string): { productoId: number; cantidad: number; nombre?: string; precio?: number }[] => {
    try { return JSON.parse(s) || [] } catch { return [] }
  }
  const allIds = [...new Set(pedidos.flatMap(p => parse(p.items).map(i => i.productoId)))].filter(Boolean)
  const productos = allIds.length
    ? await prisma.producto.findMany({
        where: { id: { in: allIds } },
        select: { id: true, nombre: true, precio: true, precioOferta: true },
      })
    : []
  const pmap = new Map(productos.map(p => [p.id, p]))

  const enriched = pedidos.map(p => ({
    ...p,
    itemsDetalle: parse(p.items).map(i => {
      const prod = pmap.get(i.productoId)
      return {
        productoId: i.productoId,
        nombre: i.nombre ?? prod?.nombre ?? `Producto #${i.productoId}`,
        cantidad: i.cantidad,
        precio: i.precio ?? prod?.precioOferta ?? prod?.precio ?? 0,
      }
    }),
  }))

  return <PedidosAdmin pedidos={enriched} />
}
