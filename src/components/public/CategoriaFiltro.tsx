'use client'
import { useState } from 'react'
import ProductoGrid from './ProductoGrid'

interface Subcategoria { id: number; nombre: string; slug: string }
interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean; stock: number
  categoria: { nombre: string; slug: string }
  subcategoriaId?: number | null
}

interface Props {
  productos: Producto[]
  subcategorias: Subcategoria[]
}

export default function CategoriaFiltro({ productos, subcategorias }: Props) {
  const [activaId, setActivaId] = useState<number | null>(null)

  const filtrados = activaId === null
    ? productos
    : productos.filter(p => p.subcategoriaId === activaId)

  if (subcategorias.length === 0) {
    return <ProductoGrid productos={productos} />
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
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
      <ProductoGrid productos={filtrados} />
    </div>
  )
}
