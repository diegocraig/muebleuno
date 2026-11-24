import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { deducirProducto } from './medidas'
import { ELECTROS_BASE } from './electrosBase'
import type { DefModulo, ElectroCatalogo, ProductoCatalogo, TipoEnvioOpcion } from './tipos'
import type { RefProducto } from './escena'

/**
 * Guard para páginas: el layout de /render ya lo chequea, pero Next no vuelve a
 * ejecutar el layout en navegaciones internas, así que cada página lo repite.
 */
export async function exigirAdmin(volverA = '/render') {
  const s = await getSession()
  if (!s || s.rol !== 'admin') redirect(`/admin/login?next=${encodeURIComponent(volverA)}`)
  return s
}

/** Solo el admin del panel puede usar /render y sus APIs. */
export async function adminORespuesta() {
  const s = await getSession()
  if (!s || s.rol !== 'admin') return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { session: s }
}

function primeraImagen(raw: string): string | null {
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : null
  } catch {
    return null
  }
}

/** Solo las medidas del ajuste guardado: el diseño del frente sale siempre de la ficha del producto. */
function aplicarAjuste(def: DefModulo | null, ajuste: string | undefined): DefModulo | null {
  if (!ajuste || !def) return def
  try {
    const a = JSON.parse(ajuste) as Partial<DefModulo>
    const num = (v: unknown) => (typeof v === 'number' && v > 0 && v <= 400 ? v : undefined)
    return {
      ...def,
      ...(num(a.ancho) ? { ancho: a.ancho } : {}),
      ...(num(a.alto) ? { alto: a.alto } : {}),
      ...(num(a.profundidad) ? { profundidad: a.profundidad } : {}),
    }
  } catch { return def } // ajuste corrupto: se ignora
}

type FilaProducto = { id: number; nombre: string; datosUtiles: string | null }

/** Definición 3D vigente de un producto (ficha + medidas del nombre + ajuste guardado). */
function definir(p: FilaProducto, ajuste: string | undefined) {
  const deducido = deducirProducto(p.nombre, p.datosUtiles, p.id)
  return { ...deducido, def: aplicarAjuste(deducido.def, ajuste) }
}

/** Productos de la categoría Cocina con su definición 3D (deducida o ajustada). */
export async function catalogoCocina(): Promise<ProductoCatalogo[]> {
  const cat = await prisma.categoria.findFirst({ where: { slug: { contains: 'cocina' } } })
  const productos = await prisma.producto.findMany({
    where: { activo: true, ...(cat ? { categoriaId: cat.id } : {}) },
    include: { subcategoria: { select: { nombre: true } } },
    orderBy: [{ subcategoriaId: 'asc' }, { nombre: 'asc' }],
  })
  const ajustes = await prisma.renderModulo.findMany({ where: { productoId: { in: productos.map(p => p.id) } } })
  const mapaAjustes = new Map(ajustes.map(a => [a.productoId, a.datos]))

  return productos.map(p => {
    const ajuste = mapaAjustes.get(p.id)
    const { grupo, def, combo } = definir(p, ajuste)
    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      precio: p.precioOferta ?? p.precio,
      precioLista: p.precio,
      imagen: primeraImagen(p.imagenes),
      subcategoria: p.subcategoria?.nombre ?? null,
      grupo,
      def,
      combo,
      ajustado: !!ajuste,
    }
  })
}

/**
 * Precio vigente y medidas originales de los productos de un proyecto (aunque
 * ya no estén activos), para calcular el presupuesto en el servidor.
 */
export async function referenciasProductos(ids: number[]): Promise<Map<number, RefProducto>> {
  if (!ids.length) return new Map()
  const productos = await prisma.producto.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, datosUtiles: true, precio: true, precioOferta: true },
  })
  const ajustes = await prisma.renderModulo.findMany({ where: { productoId: { in: ids } } })
  const mapaAjustes = new Map(ajustes.map(a => [a.productoId, a.datos]))
  return new Map(productos.map(p => {
    const { def, combo } = definir(p, mapaAjustes.get(p.id))
    return [p.id, { precio: p.precioOferta ?? p.precio, def, combo }]
  }))
}

let sincronizado = false
/**
 * Agrega a la tabla los modelos de la base de referencia que todavía no estén
 * (por tipo+marca+modelo). Los que el admin "borra" quedan con activo=false,
 * así que no reaparecen. Corre una vez por proceso.
 */
export async function asegurarElectros() {
  if (sincronizado) return
  const existentes = await prisma.electrodomestico.findMany({ select: { tipo: true, marca: true, modelo: true } })
  const clave = (e: { tipo: string; marca: string; modelo: string }) => `${e.tipo}|${e.marca}|${e.modelo}`.toLowerCase()
  const hay = new Set(existentes.map(clave))
  const faltan = ELECTROS_BASE.filter(e => !hay.has(clave(e)))
  if (faltan.length) await prisma.electrodomestico.createMany({ data: faltan })
  sincronizado = true
}

export async function listarElectros(): Promise<ElectroCatalogo[]> {
  await asegurarElectros()
  const filas = await prisma.electrodomestico.findMany({
    where: { activo: true },
    orderBy: [{ tipo: 'asc' }, { marca: 'asc' }, { modelo: 'asc' }],
  })
  return filas as unknown as ElectroCatalogo[]
}

export async function tiposEnvio(): Promise<TipoEnvioOpcion[]> {
  return prisma.tipoEnvio.findMany({ where: { activo: true }, select: { id: true, nombre: true, costo: true } })
}
