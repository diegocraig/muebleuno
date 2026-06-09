'use client'
import { useState } from 'react'
import ProductoGrid from './ProductoGrid'

type Orden = '' | 'precio_asc' | 'precio_desc' | 'volumen_asc' | 'volumen_desc' | 'nombre'

interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean; stock: number
  volumen?: number | null
  categoria: { nombre: string; slug: string }
}

export default function ProductosOrdenables({ productos }: { productos: Producto[] }) {
  const [orden, setOrden] = useState<Orden>('')

  const ordenados = [...productos].sort((a, b) => {
    if (orden === 'precio_asc') return (a.precioOferta ?? a.precio) - (b.precioOferta ?? b.precio)
    if (orden === 'precio_desc') return (b.precioOferta ?? b.precio) - (a.precioOferta ?? a.precio)
    if (orden === 'volumen_asc') return (a.volumen ?? 0) - (b.volumen ?? 0)
    if (orden === 'volumen_desc') return (b.volumen ?? 0) - (a.volumen ?? 0)
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre)
    return 0
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
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
      </div>
      <ProductoGrid productos={ordenados} />
    </div>
  )
}
