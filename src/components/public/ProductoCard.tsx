'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from './CartProvider'

interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean; stock: number
  categoria: { nombre: string; slug: string }
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { addItem } = useCart()
  const imagenes = JSON.parse(producto.imagenes || '[]') as string[]
  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = !!producto.precioOferta && producto.precioOferta < producto.precio
  const sinStock = producto.stock === 0

  const [imgIdx, setImgIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)

  const imagen = imagenes[imgIdx] ?? imagenes[0] ?? null

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    didSwipe.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      didSwipe.current = true
      if (diff > 0) setImgIdx(i => Math.min(i + 1, imagenes.length - 1))
      else setImgIdx(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault()
      didSwipe.current = false
    }
  }

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
      onClick={handleLinkClick}
      className="group bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-all flex flex-col">
      <div
        className="relative aspect-square bg-gris-fondo overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {imagen ? (
          <img src={imagen} alt={producto.nombre}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none ${sinStock ? 'opacity-50' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gris-claro text-4xl">📦</div>
        )}

        {/* Dot indicators */}
        {imagenes.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {imagenes.map((_, i) => (
              <span key={i} className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {sinStock ? (
            <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded">SIN STOCK</span>
          ) : (
            <>
              {tieneOferta && (
                <span className="bg-rojo-principal text-white text-xs font-bold px-2 py-0.5 rounded">OFERTA</span>
              )}
              {producto.novedad && (
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">NUEVO</span>
              )}
            </>
          )}
        </div>

        {!sinStock && (
          <button
            onClick={handleAdd}
            className="absolute bottom-2 right-2 bg-rojo-principal text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rojo-hover shadow-md"
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gris-medio mb-1">{producto.categoria.nombre}</p>
        <h3 className="font-semibold text-sm leading-tight mb-2 flex-1 line-clamp-2">{producto.nombre}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-black text-lg text-gray-400">{formatPrice(precioFinal)}</span>
          {tieneOferta && (
            <span className="text-sm text-gris-claro line-through">{formatPrice(producto.precio)}</span>
          )}
        </div>
        <p className="text-sm font-bold text-rojo-principal mt-0.5">6 cuotas de {formatPrice(Math.ceil(precioFinal / 6))}</p>
        {!sinStock && producto.stock <= 3 && (
          <p className="text-xs text-orange-500 font-semibold mt-1.5">
            ¡Quedan solo {producto.stock} {producto.stock === 1 ? 'unidad' : 'unidades'}!
          </p>
        )}
      </div>
    </Link>
  )
}
