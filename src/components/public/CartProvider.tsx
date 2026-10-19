'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { trackPixel, MONEDA } from '@/lib/pixel'

const STORAGE_KEY = 'muebleuno_cart'

export interface CartItem {
  productoId: number
  nombre: string
  precio: number
  imagen: string
  cantidad: number
  colorId?: number
  colorNombre?: string
  /** Stock del color al agregarlo: tope de cantidad en el carrito (el server revalida). */
  stockMax?: number
}

/** Una línea por producto + color: el mismo rack en dos colores son dos líneas. */
export const itemKey = (i: Pick<CartItem, 'productoId' | 'colorId'>) => `${i.productoId}:${i.colorId ?? 0}`

export interface TipoEnvio {
  id: number
  nombre: string
  costo: number
  activo: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'cantidad'>) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, cantidad: number) => void
  clear: () => void
  total: number
  count: number
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  tipoEnvio: TipoEnvio | null
  setTipoEnvio: (t: TipoEnvio | null) => void
  costoEnvio: number
  totalConEnvio: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  // Arranca vacío igual que el HTML del server; leer localStorage en el render
  // inicial hacía que el cliente hidratara con items y React tiraba el #418.
  const [items, setItems] = useState<CartItem[]>([])
  const [cargado, setCargado] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Si ya se agregó algo antes de terminar de montar, no lo pisa.
        if (Array.isArray(parsed)) setItems(prev => prev.length ? prev : parsed)
      }
    } catch {}
    setCargado(true)
  }, [])

  useEffect(() => {
    // Hasta haber leído lo guardado no se escribe, o el [] inicial lo borraría.
    if (!cargado) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, cargado])

  const addItem = useCallback((item: Omit<CartItem, 'cantidad'>) => {
    // AddToCart va acá y no en los botones para cubrir de una vez la ficha de
    // producto, las cards del listado y cualquier otro lugar que agregue al carrito.
    trackPixel('AddToCart', {
      content_type: 'product',
      content_ids: [String(item.productoId)],
      content_name: item.nombre,
      value: item.precio,
      currency: MONEDA,
    })
    const key = itemKey(item)
    setItems(prev => {
      const exists = prev.find(i => itemKey(i) === key)
      if (exists) {
        const tope = item.stockMax ?? Infinity
        return prev.map(i => itemKey(i) === key ? { ...i, ...item, cantidad: Math.min(i.cantidad + 1, tope) } : i)
      }
      return [...prev, { ...item, cantidad: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => itemKey(i) !== key))
  }, [])

  const updateQuantity = useCallback((key: string, cantidad: number) => {
    if (cantidad <= 0) { removeItem(key); return }
    setItems(prev => prev.map(i => itemKey(i) === key ? { ...i, cantidad: Math.min(cantidad, i.stockMax ?? Infinity) } : i))
  }, [removeItem])

  const clear = useCallback(() => {
    setItems([])
    setTipoEnvio(null)
  }, [])

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const count = items.reduce((sum, i) => sum + i.cantidad, 0)
  const costoEnvio = tipoEnvio?.costo ?? 0
  const totalConEnvio = total + costoEnvio

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clear,
      total, count, isOpen, setIsOpen,
      tipoEnvio, setTipoEnvio, costoEnvio, totalConEnvio,
    }}>
      {children}
    </CartContext.Provider>
  )
}
