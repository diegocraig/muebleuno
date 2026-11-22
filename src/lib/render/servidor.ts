import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { deducirProducto } from './medidas'
import { ELECTROS_BASE } from './electrosBase'
import type { DefModulo, ElectroCatalogo, ProductoCatalogo, TipoEnvioOpcion } from './tipos'

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
    const deducido = deducirProducto(p.nombre, p.datosUtiles)
    let def = deducido.def
    const ajuste = mapaAjustes.get(p.id)
    if (ajuste && def) {
      try { def = { ...def, ...(JSON.parse(ajuste) as Partial<DefModulo>) } } catch { /* ajuste corrupto: se ignora */ }
    }
    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      precio: p.precioOferta ?? p.precio,
      precioLista: p.precio,
      imagen: primeraImagen(p.imagenes),
      subcategoria: p.subcategoria?.nombre ?? null,
      grupo: deducido.grupo,
      def,
      combo: deducido.combo,
      ajustado: !!ajuste,
    }
  })
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
