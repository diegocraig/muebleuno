'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface CartItem {
  productoId: number
  nombre: string
  precio: number
  imagen: string
  cantidad: number
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
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

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

  const clear = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const count = items.reduce((sum, i) => sum + i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}
