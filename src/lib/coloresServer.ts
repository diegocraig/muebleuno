import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { HEX_RE, MAX_NOMBRE_COLOR, imagenColor, parseImagenes } from './colores'

type Tx = Prisma.TransactionClient

export interface ColorInput {
  id?: number
  nombre: string
  hex: string | null
  imagenes: string[]
  stock: number
}

/**
 * Valida los colores que manda el formulario de producto. Devuelve un mensaje
 * de error legible para el admin si algo no cuadra.
 */
export function normalizarColores(raw: unknown): { colores: ColorInput[] } | { error: string } {
  if (!Array.isArray(raw)) return { colores: [] }
  const colores: ColorInput[] = []
  const vistos = new Set<string>()

  for (const c of raw as Record<string, unknown>[]) {
    const nombre = String(c?.nombre ?? '').trim()
    if (!nombre) return { error: 'Todos los colores necesitan un nombre.' }
    if (nombre.length > MAX_NOMBRE_COLOR) return { error: `El nombre "${nombre}" es muy largo (máximo ${MAX_NOMBRE_COLOR} caracteres).` }
    const clave = nombre.toLocaleLowerCase('es')
    if (vistos.has(clave)) return { error: `El color "${nombre}" está repetido.` }
    vistos.add(clave)

    const imagenes = Array.isArray(c.imagenes) ? c.imagenes.filter((i): i is string => typeof i === 'string' && i.length > 0) : []
    if (!imagenes.length) return { error: `Cargá al menos una foto para el color "${nombre}".` }

    const hex = typeof c.hex === 'string' && HEX_RE.test(c.hex) ? c.hex.toLowerCase() : null
    const stock = Math.max(0, parseInt(String(c.stock ?? 0)) || 0)
    const id = Number(c.id) > 0 ? Number(c.id) : undefined
    colores.push({ id, nombre, hex, imagenes, stock })
  }
  return { colores }
}

/** Producto.stock = suma de sus colores (si tiene colores). */
export async function sincronizarStock(tx: Tx, productoId: number) {
  const agg = await tx.productoColor.aggregate({ where: { productoId }, _sum: { stock: true }, _count: true })
  if (agg._count > 0) {
    await tx.producto.update({ where: { id: productoId }, data: { stock: agg._sum.stock ?? 0 } })
  }
}

/**
 * Reemplaza los colores del producto por la lista recibida: actualiza los que
 * traen id, crea los nuevos y borra los que ya no están. El orden es el del array.
 */
export async function guardarColores(tx: Tx, productoId: number, colores: ColorInput[]) {
  const actuales = await tx.productoColor.findMany({ where: { productoId }, select: { id: true } })
  const actualesIds = new Set(actuales.map(c => c.id))
  const conservar = colores.filter(c => c.id && actualesIds.has(c.id)).map(c => c.id!)

  await tx.productoColor.deleteMany({ where: { productoId, id: { notIn: conservar } } })

  for (const [orden, c] of colores.entries()) {
    const data = { nombre: c.nombre, hex: c.hex, imagenes: JSON.stringify(c.imagenes), stock: c.stock, orden }
    if (c.id && actualesIds.has(c.id)) {
      await tx.productoColor.update({ where: { id: c.id }, data })
    } else {
      await tx.productoColor.create({ data: { ...data, productoId } })
    }
  }

  await sincronizarStock(tx, productoId)
}

/** Línea de pedido tal como se guarda en Pedido.items (snapshot). */
export interface LineaPedido {
  productoId: number
  cantidad: number
  nombre: string
  precio: number
  colorId?: number
  colorNombre?: string
  imagen?: string
}

const MAX_CANTIDAD = 99

/**
 * Valida los items del carrito contra la DB: precio real, producto activo y,
 * si el producto tiene colores, que el color elegido exista, sea de ese
 * producto y tenga stock. Usado por /api/pedidos y /api/nave/checkout.
 */
export async function resolverLineas(
  rawItems: unknown,
): Promise<{ lineas: LineaPedido[] } | { error: string }> {
  const items = (Array.isArray(rawItems) ? rawItems : []) as Record<string, unknown>[]
  const ids = [...new Set(items.map(i => Number(i?.productoId)).filter(n => n > 0))]
  const productos = ids.length
    ? await prisma.producto.findMany({
        where: { id: { in: ids }, activo: true },
        select: {
          id: true, nombre: true, precio: true, precioOferta: true, imagenes: true,
          colores: { select: { id: true, nombre: true, stock: true, imagenes: true } },
        },
      })
    : []
  const pmap = new Map(productos.map(p => [p.id, p]))

  const lineas: LineaPedido[] = []
  for (const item of items) {
    const prod = pmap.get(Number(item?.productoId))
    const cantidad = Math.min(MAX_CANTIDAD, parseInt(String(item?.cantidad ?? 0)) || 0)
    if (!prod || cantidad <= 0) continue
    const precio = prod.precioOferta ?? prod.precio

    if (prod.colores.length === 0) {
      lineas.push({ productoId: prod.id, cantidad, nombre: prod.nombre, precio, imagen: parseImagenes(prod.imagenes)[0] })
      continue
    }

    const color = prod.colores.find(c => c.id === Number(item?.colorId))
    if (!color) return { error: `Elegí un color para "${prod.nombre}" antes de continuar.` }
    if (color.stock <= 0) return { error: `"${prod.nombre}" en color ${color.nombre} se agotó. Elegí otro color.` }
    if (cantidad > color.stock) {
      return { error: `De "${prod.nombre}" en color ${color.nombre} quedan ${color.stock} ${color.stock === 1 ? 'unidad' : 'unidades'}.` }
    }
    lineas.push({
      productoId: prod.id, cantidad, nombre: prod.nombre, precio,
      colorId: color.id, colorNombre: color.nombre, imagen: imagenColor(color),
    })
  }

  if (!lineas.length) return { error: 'No hay productos válidos en el pedido' }
  return { lineas }
}

/** include de Prisma con lo que necesitan las cards y la ficha para mostrar colores. */
export const INCLUDE_COLORES = {
  colores: {
    orderBy: { orden: 'asc' as const },
    select: { id: true, nombre: true, hex: true, imagenes: true, stock: true },
  },
}
