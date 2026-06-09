'use client'
import { useState } from 'react'
import ProductoGrid from './ProductoGrid'

type Orden = '' | 'precio_asc' | 'precio_desc' | 'volumen_asc' | 'volumen_desc' | 'nombre'

interface Subcategoria { id: number; nombre: string; slug: string }
interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean; stock: number
  volumen?: number | null
  categoria: { nombre: string; slug: string }
  subcategoriaId?: number | null
}

interface Props {
  productos: Producto[]
  subcategorias: Subcategoria[]
}

export default function CategoriaFiltro({ productos, subcategorias }: Props) {
  const [activaId, setActivaId] = useState<number | null>(null)
  const [orden, setOrden] = useState<Orden>('')

  const filtrados = activaId === null
    ? productos
    : productos.filter(p => p.subcategoriaId === activaId)

  const ordenados = [...filtrados].sort((a, b) => {
    if (orden === 'precio_asc') return (a.precioOferta ?? a.precio) - (b.precioOferta ?? b.precio)
    if (orden === 'precio_desc') return (b.precioOferta ?? b.precio) - (a.precioOferta ?? a.precio)
    if (orden === 'volumen_asc') return (a.volumen ?? 0) - (b.volumen ?? 0)
    if (orden === 'volumen_desc') return (b.volumen ?? 0) - (a.volumen ?? 0)
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre)
    return 0
  })

  const ordenSelector = (
    <select
      value={orden}
      onChange={e => setOrden(e.target.value as Orden)}
      className="border rounded px-3 py-1.5 text-sm"
    >
      <option value="">Más nuevos</option>
      <option value="precio_asc">Precio: menor a mayor</option>
      <option value="precio_desc">Precio: mayor a menor</option>
      <option value="volumen_asc">Volumen (L): menor a mayor</option>
      <option value="volumen_desc">Volumen (L): mayor a menor</option>
      <option value="nombre">Nombre A-Z</option>
    </select>
  )

  if (subcategorias.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-4">{ordenSelector}</div>
        <ProductoGrid productos={ordenados} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivaId(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activaId === null
                ? 'bg-rojo-principal text-white border-rojo-principal'
                : 'border-gris-claro text-gris-oscuro hover:border-rojo-principal hover:text-rojo-principal'
            }`}
          >
            Todos
          </button>
          {subcategorias.map(sub => (
            <button
              key={sub.id}
              onClick={() => setActivaId(sub.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activaId === sub.id
                  ? 'bg-rojo-principal text-white border-rojo-principal'
                  : 'border-gris-claro text-gris-oscuro hover:border-rojo-principal hover:text-rojo-principal'
              }`}
            >
              {sub.nombre}
              <span className="ml-1.5 opacity-60 text-xs">
                ({productos.filter(p => p.subcategoriaId === sub.id).length})
              </span>
            </button>
          ))}
        </div>
        {ordenSelector}
      </div>
      <ProductoGrid productos={ordenados} />
    </div>
  )
}
