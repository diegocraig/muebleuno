'use client'
import { useState, useRef } from 'react'
import { MessageCircle, ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from './CartProvider'

interface Producto {
  id: number; nombre: string; precio: number; precioOferta?: number | null
  descripcion?: string | null; imagenes: string; stock: number
  categoria: { nombre: string; slug: string }
}

export default function ProductoDetalle({ producto }: { producto: Producto }) {
  const imagenes = JSON.parse(producto.imagenes || '[]') as string[]
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedImg = imagenes[selectedIdx] ?? ''
  const touchStartX = useRef<number | null>(null)
  const { addItem } = useCart()

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) setSelectedIdx(i => Math.min(i + 1, imagenes.length - 1))
      else setSelectedIdx(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = !!producto.precioOferta && producto.precioOferta < producto.precio
  const whatsappMsg = `Hola! Me interesa el producto: ${producto.nombre} (${formatPrice(precioFinal)}). ¿Tienen disponibilidad?`

  return (
    <div className="grid md:grid-cols-2 gap-10">
      {/* Gallery */}
      <div>
        <div
          className="aspect-square bg-gris-fondo rounded-xl overflow-hidden mb-3 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {selectedImg ? (
            <img src={selectedImg} alt={producto.nombre} className="w-full h-full object-contain pointer-events-none" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
        </div>
        {imagenes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imagenes.map((img, i) => (
              <button key={i} onClick={() => setSelectedIdx(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedIdx === i ? 'border-rojo-principal' : 'border-transparent'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-sm text-gris-medio mb-2">{producto.categoria.nombre}</p>
        <h1 className="text-3xl font-bold mb-4">{producto.nombre}</h1>

        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-4xl font-black text-rojo-principal">{formatPrice(precioFinal)}</span>
          {tieneOferta && (
            <>
              <span className="text-xl text-gris-claro line-through">{formatPrice(producto.precio)}</span>
              <span className="bg-rojo-principal text-white text-sm font-bold px-2 py-0.5 rounded">
                {Math.round((1 - precioFinal / producto.precio) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {producto.descripcion && (
          <p className="text-gris-medio leading-relaxed mb-6">{producto.descripcion}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => addItem({ productoId: producto.id, nombre: producto.nombre, precio: precioFinal, imagen: selectedImg })}
            className="flex items-center justify-center gap-2 bg-rojo-principal hover:bg-rojo-hover text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            Agregar al carrito
          </button>
          <a
            href={`https://wa.me/5491126484463?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        </div>

        {producto.stock > 0 && (
          <p className="text-green-600 text-sm font-medium mt-4">✓ En stock</p>
        )}
      </div>
    </div>
  )
}
