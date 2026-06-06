'use client'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from './CartProvider'

interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean
  categoria: { nombre: string; slug: string }
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart()
  const imagenes = JSON.parse(producto.imagenes || '[]') as string[]
  const imagen = imagenes[0] ?? null
  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = !!producto.precioOferta && producto.precioOferta < producto.precio

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: precioFinal,
      imagen: imagen ?? '',
    })
  }

  return (
    <Link href={`/productos/${producto.slug}`}
      className="group bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-all flex flex-col">
      <div className="relative aspect-square bg-gris-fondo overflow-hidden">
        {imagen ? (
          <img src={imagen} alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gris-claro text-4xl">📦</div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {tieneOferta && (
            <span className="bg-rojo-principal text-white text-xs font-bold px-2 py-0.5 rounded">OFERTA</span>
          )}
          {producto.novedad && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">NUEVO</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="absolute bottom-2 right-2 bg-rojo-principal text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rojo-hover shadow-md"
          title="Agregar al carrito"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gris-medio mb-1">{producto.categoria.nombre}</p>
        <h3 className="font-semibold text-sm leading-tight mb-2 flex-1 line-clamp-2">{producto.nombre}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-lg text-rojo-principal">{formatPrice(precioFinal)}</span>
          {tieneOferta && (
            <span className="text-sm text-gris-claro line-through">{formatPrice(producto.precio)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
