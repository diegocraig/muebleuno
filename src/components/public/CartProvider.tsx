'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'muebleuno_cart'

interface CartItem {
  productoId: number
  nombre: string
  precio: number
  imagen: string
  cantidad: number
}

export interface TipoEnvio {
  id: number
  nombre: string
  costo: number
  activo: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'cantidad'>) => void
  removeItem: (productoId: number) => void
  updateQuantity: (productoId: number, cantidad: number) => void
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
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'cantidad'>) => {
    setItems(prev => {
      const exists = prev.find(i => i.productoId === item.productoId)
      if (exists) return prev.map(i => i.productoId === item.productoId ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...item, cantidad: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productoId: number) => {
    setItems(prev => prev.filter(i => i.productoId !== productoId))
  }, [])

  const updateQuantity = useCallback((productoId: number, cantidad: number) => {
    if (cantidad <= 0) { removeItem(productoId); return }
    setItems(prev => prev.map(i => i.productoId === productoId ? { ...i, cantidad } : i))
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
