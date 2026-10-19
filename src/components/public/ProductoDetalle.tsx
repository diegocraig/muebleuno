'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, ShoppingCart, ChevronDown, Ruler, Package, ShieldCheck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from './CartProvider'
import Cuotas12 from './Cuotas12'
import { parseImagenes, colorSlug, imagenColor, type ColorProducto } from '@/lib/colores'

interface Producto {
  id: number; nombre: string; precio: number; precioOferta?: number | null
  descripcion?: string | null; imagenes: string; stock: number
  datosUtiles?: string | null; infoEmbalaje?: string | null; garantia?: string | null
  categoria: { nombre: string; slug: string }
  colores?: ColorProducto[]
}

function renderTexto(texto: string) {
  const bloques = texto.split(/\n{2,}/)
  return bloques.map((bloque, bi) => {
    const lineas = bloque.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lineas.length) return null
    const tieneBullets = lineas.some(l => l.startsWith('-'))
    const esCabecera = tieneBullets && !lineas[0].startsWith('-')
    return (
      <div key={bi} className={bi > 0 ? 'mt-4' : ''}>
        {esCabecera && (
          <p className="font-semibold text-gris-oscuro mb-2 text-sm">{lineas[0]}</p>
        )}
        {tieneBullets ? (
          <ul className="space-y-1">
            {lineas.filter(l => l.startsWith('-')).map((l, i) => (
              <li key={i} className="flex gap-2 text-gris-medio text-sm">
                <span className="text-rojo-principal mt-0.5 shrink-0 font-bold">·</span>
                <span>{l.slice(1).trim()}</span>
              </li>
            ))}
          </ul>
        ) : (
          lineas.map((l, i) => (
            <p key={i} className="text-gris-medio leading-relaxed text-sm">{l}</p>
          ))
        )}
      </div>
    )
  })
}

const SECCIONES = [
  {
    id: 'datos',
    titulo: 'Datos útiles',
    icon: Ruler,
    campo: 'datosUtiles' as const,
  },
  {
    id: 'embalaje',
    titulo: 'Información del embalaje',
    icon: Package,
    campo: 'infoEmbalaje' as const,
  },
  {
    id: 'garantia',
    titulo: 'Garantía',
    icon: ShieldCheck,
    campo: 'garantia' as const,
  },
]

function AccordionExclusivo({ producto }: { producto: Producto }) {
  const seccionesConDatos = SECCIONES.filter(s => !!producto[s.campo])
  const [abierto, setAbierto] = useState<string | null>(seccionesConDatos[0]?.id ?? null)

  if (!seccionesConDatos.length) return null

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {seccionesConDatos.map((sec, idx) => {
        const Icon = sec.icon
        const isOpen = abierto === sec.id
        const isLast = idx === seccionesConDatos.length - 1

        return (
          <div key={sec.id} className={!isLast ? 'border-b border-gray-100' : ''}>
            <button
              onClick={() => setAbierto(isOpen ? null : sec.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors duration-200 ${
                isOpen
                  ? 'bg-rojo-principal text-white'
                  : 'bg-white hover:bg-gris-fondo text-gris-oscuro'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                isOpen ? 'bg-white/20' : 'bg-rojo-principal/10'
              }`}>
                <Icon className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-rojo-principal'}`} />
              </div>
              <span className="flex-1 font-semibold text-sm tracking-wide uppercase">
                {sec.titulo}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-all duration-300 ${
                  isOpen ? 'rotate-180 text-white/80' : 'text-gris-claro'
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                {renderTexto(producto[sec.campo]!)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SelectorColor({ colores, actual, onSelect }: {
  colores: ColorProducto[]; actual: number; onSelect: (idx: number) => void
}) {
  const color = colores[actual]
  return (
    <div className="mb-6">
      <p className="text-sm mb-2.5">
        <span className="text-gris-medio">Color: </span>
        <span className="font-semibold text-gris-oscuro">{color?.nombre}</span>
        {color && color.stock <= 0 && <span className="ml-2 text-xs font-semibold text-gris-medio">(Agotado)</span>}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {colores.map((c, i) => {
          const agotado = c.stock <= 0
          const img = imagenColor(c)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(i)}
              title={agotado ? `${c.nombre} (agotado)` : c.nombre}
              aria-label={c.nombre}
              aria-pressed={i === actual}
              className={`relative w-12 h-12 rounded-full p-0.5 border-2 transition-colors ${
                i === actual ? 'border-rojo-principal' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span
                className={`block w-full h-full rounded-full bg-gris-fondo bg-cover bg-center ${agotado ? 'opacity-40' : ''}`}
                style={c.hex ? { backgroundColor: c.hex } : img ? { backgroundImage: `url(${img})` } : undefined}
              />
              {agotado && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="block w-full h-0.5 bg-gris-medio/70 rotate-45" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ProductoDetalle({ producto }: { producto: Producto }) {
  const colores = producto.colores ?? []
  const generales = parseImagenes(producto.imagenes)
  // Por defecto, el primer color con stock (si todos están agotados, el primero).
  const [colorIdx, setColorIdx] = useState(() => Math.max(0, colores.findIndex(c => c.stock > 0)))
  const color: ColorProducto | undefined = colores[colorIdx]
  const imagenes = color ? [...parseImagenes(color.imagenes), ...generales] : generales
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const { addItem } = useCart()

  const selectedImg = imagenes[selectedIdx] ?? ''

  // ?color=verde-olivo permite compartir (o anunciar) el link directo a un color.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('color')
    if (!slug) return
    const idx = colores.findIndex(c => colorSlug(c.nombre) === slug)
    if (idx >= 0) setColorIdx(idx)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const elegirColor = (idx: number) => {
    setColorIdx(idx)
    setSelectedIdx(0)
    const url = new URL(window.location.href)
    url.searchParams.set('color', colorSlug(colores[idx].nombre))
    window.history.replaceState(null, '', url)
  }

  const stock = color ? color.stock : producto.stock
  const colorAgotado = !!color && color.stock <= 0

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
    setDragX(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if ((selectedIdx === 0 && diff > 0) || (selectedIdx === imagenes.length - 1 && diff < 0)) {
      setDragX(diff * 0.2)
    } else {
      setDragX(diff)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    setIsDragging(false)
    setDragX(0)
    if (Math.abs(diff) > 40) {
      if (diff > 0) setSelectedIdx(i => Math.min(i + 1, imagenes.length - 1))
      else setSelectedIdx(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  const precioFinal = producto.precioOferta ?? producto.precio
  const tieneOferta = !!producto.precioOferta && producto.precioOferta < producto.precio
  const whatsappMsg = `Hola Facundo! Me interesa el producto: ${producto.nombre}${color ? ` en color ${color.nombre}` : ''} (${formatPrice(precioFinal)}). ¿Tienen disponibilidad?`

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-10">
        {/* Gallery — min-w-0: sin esto la tira de miniaturas (con muchas fotos) ensancha la grilla en celular */}
        <div className="flex flex-col md:flex-row gap-3 min-w-0">
          {imagenes.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto order-2 md:order-1 pb-1 md:pb-0">
              {imagenes.map((img, i) => (
                <button key={i} onClick={() => setSelectedIdx(i)}
                  className={`shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-colors ${selectedIdx === i ? 'border-rojo-principal' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div
            className="flex-1 aspect-square bg-gris-fondo rounded-xl overflow-hidden select-none order-1 md:order-2"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imagenes.length > 0 ? (
              <div
                key={color?.id ?? 0}
                className="flex h-full"
                style={{
                  width: `${imagenes.length * 100}%`,
                  transform: `translateX(calc(-${selectedIdx * (100 / imagenes.length)}% + ${dragX / imagenes.length}px))`,
                  transition: isDragging ? 'none' : 'transform 300ms ease',
                }}
              >
                {imagenes.map((img, i) => (
                  <div key={i} className="h-full" style={{ width: `${100 / imagenes.length}%` }}>
                    <img src={img} alt={producto.nombre} className="w-full h-full object-contain pointer-events-none" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gris-medio mb-2">{producto.categoria.nombre}</p>
          <h1 className="text-3xl font-bold mb-4">{producto.nombre}</h1>

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-400">{formatPrice(precioFinal)}</span>
              {tieneOferta && (
                <>
                  <span className="text-xl text-gris-claro line-through">{formatPrice(producto.precio)}</span>
                  <span className="bg-rojo-principal text-white text-sm font-bold px-2 py-0.5 rounded">
                    {Math.round((1 - precioFinal / producto.precio) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-base font-bold text-rojo-principal mt-1">6 cuotas de {formatPrice(Math.ceil(precioFinal / 6))}</p>
            <Cuotas12 precio={precioFinal} size="base" />
          </div>

          {producto.descripcion && (
            <p className="text-gris-medio leading-relaxed mb-6 text-sm">{producto.descripcion}</p>
          )}

          {colores.length > 0 && <SelectorColor colores={colores} actual={colorIdx} onSelect={elegirColor} />}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => addItem({
                productoId: producto.id,
                nombre: producto.nombre,
                precio: precioFinal,
                imagen: color ? imagenColor(color) || selectedImg : selectedImg,
                ...(color ? { colorId: color.id, colorNombre: color.nombre, stockMax: color.stock } : {}),
              })}
              disabled={colorAgotado}
              className="flex items-center justify-center gap-2 bg-rojo-principal hover:bg-rojo-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {colorAgotado ? `Sin stock en ${color.nombre}` : 'Agregar al carrito'}
            </button>
            <a
              href={`https://wa.me/5491173670283?text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Consultar por WhatsApp
            </a>
          </div>

          {stock > 3 && (
            <p className="text-green-600 text-sm font-medium mt-4">✓ En stock</p>
          )}
          {stock > 0 && stock <= 3 && (
            <p className="text-orange-500 text-sm font-semibold mt-4">
              ⚡ ¡Quedan solo {stock} {stock === 1 ? 'unidad' : 'unidades'}{color ? ` en ${color.nombre}` : ''}!
            </p>
          )}
        </div>
      </div>

      {/* Accordion exclusivo */}
      <div className="mt-12">
        <AccordionExclusivo producto={producto} />
      </div>

    </div>
  )
}
