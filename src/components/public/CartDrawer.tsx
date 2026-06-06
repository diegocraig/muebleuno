'use client'
import { useState } from 'react'
import { X, Trash2, MessageCircle } from 'lucide-react'
import { useCart } from './CartProvider'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clear, total } = useCart()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const waMessage = items.map(i => `- ${i.nombre} x${i.cantidad}: ${formatPrice(i.precio * i.cantidad)}`).join('\n')
    + `\n\nTotal: ${formatPrice(total)}`

  const handlePedido = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await fetch('/muebleuno/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, total }),
    })
    setSending(false)
    setSent(true)
    clear()
    setTimeout(() => { setSent(false); setShowForm(false); setIsOpen(false) }, 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={() => setIsOpen(false)} />
      <div className="w-full max-w-md bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Mi Carrito</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:text-rojo-principal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-4xl mb-4">✅</p>
              <p className="text-xl font-bold mb-2">¡Pedido enviado!</p>
              <p className="text-gris-medio">Nos contactaremos pronto.</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-gris-medio">
            <div>
              <p className="text-4xl mb-4">🛒</p>
              <p>Tu carrito está vacío</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {items.map(item => (
                <div key={item.productoId} className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gris-fondo shrink-0">
                    {item.imagen && <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.nombre}</p>
                    <p className="text-rojo-principal font-bold">{formatPrice(item.precio)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center text-sm hover:bg-gris-fondo">−</button>
                      <span className="text-sm w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                        className="w-6 h-6 rounded border flex items-center justify-center text-sm hover:bg-gris-fondo">+</button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.productoId)} className="text-gris-claro hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t px-6 py-4 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-rojo-principal">{formatPrice(total)}</span>
              </div>

              {!showForm ? (
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/5491126484463?text=${encodeURIComponent('Hola! Mi carrito:\n' + waMessage)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
                  </a>
                  <button onClick={() => setShowForm(true)}
                    className="w-full bg-rojo-principal hover:bg-rojo-hover text-white font-bold py-3 rounded-lg transition-colors">
                    Solicitar pedido
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePedido} className="space-y-2">
                  {(['nombre', 'email', 'telefono'] as const).map(f => (
                    <input key={f} required type={f === 'email' ? 'email' : 'text'}
                      placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm" />
                  ))}
                  <textarea placeholder="Notas (opcional)" rows={2}
                    value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm resize-none" />
                  <button type="submit" disabled={sending}
                    className="w-full bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors">
                    {sending ? 'Enviando...' : 'Confirmar pedido'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="w-full text-gris-medio text-sm hover:underline">
                    Volver
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
