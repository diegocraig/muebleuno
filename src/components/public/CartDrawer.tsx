'use client'
import { useState, useEffect } from 'react'
import { X, Trash2, MessageCircle, CreditCard, Truck, ChevronRight, ArrowLeft } from 'lucide-react'
import { useCart } from './CartProvider'
import type { TipoEnvio } from './CartProvider'
import { formatPrice } from '@/lib/utils'

type Step = 'carrito' | 'envio' | 'nave' | 'contacto'

export default function CartDrawer() {
  const {
    items, isOpen, setIsOpen, removeItem, updateQuantity, clear,
    total, tipoEnvio, setTipoEnvio, costoEnvio, totalConEnvio,
  } = useCart()

  const [step, setStep] = useState<Step>('carrito')
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '', direccion: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [tiposEnvio, setTiposEnvio] = useState<TipoEnvio[]>([])

  useEffect(() => {
    fetch('/api/tipos-envio')
      .then(r => r.json())
      .then((data: TipoEnvio[]) => {
        const activos = data.filter(t => t.activo)
        setTiposEnvio(activos)
        if (activos.length > 0 && !tipoEnvio) setTipoEnvio(activos[0])
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => { setIsOpen(false); setStep('carrito') }

  const waMessage = items.map(i => `- ${i.nombre} x${i.cantidad}: ${formatPrice(i.precio * i.cantidad)}`).join('\n')
    + `\n\nSubtotal productos: ${formatPrice(total)}`
    + (tipoEnvio ? `\nEnvío (${tipoEnvio.nombre}): ${tipoEnvio.costo === 0 ? 'Gratis' : formatPrice(tipoEnvio.costo)}` : '')
    + `\n\nTotal: ${formatPrice(totalConEnvio)}`

  const handleNave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/nave/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, total: totalConEnvio, tipoEnvioId: tipoEnvio?.id ?? null, costoEnvio }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) throw new Error(data.error ?? 'Error al generar el pago')
      clear()
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con Nave')
      setSending(false)
    }
  }

  const handlePedido = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, total: totalConEnvio, tipoEnvioId: tipoEnvio?.id ?? null, costoEnvio }),
    })
    setSending(false)
    setSent(true)
    clear()
    setTimeout(() => { setSent(false); setStep('carrito'); setIsOpen(false) }, 3000)
  }

  if (!isOpen) return null

  const stepTitle: Record<Step, string> = {
    carrito: 'Mi Carrito',
    envio: 'Tipo de envío',
    nave: 'Pago seguro',
    contacto: 'Dejá tus datos',
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={handleClose} />
      <div className="w-full max-w-md bg-white flex flex-col shadow-2xl h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            {step !== 'carrito' && (
              <button
                onClick={() => setStep(step === 'envio' ? 'carrito' : 'envio')}
                className="p-1 hover:text-rojo-principal mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold">{stepTitle[step]}</h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:text-rojo-principal">
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
            {/* ── PASO 1: Carrito ── */}
            {step === 'carrito' && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
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
                    <span>Subtotal</span>
                    <span className="text-rojo-principal">{formatPrice(total)}</span>
                  </div>
                  <button
                    onClick={() => setStep('envio')}
                    className="flex items-center justify-center gap-2 w-full bg-rojo-principal hover:bg-rojo-hover text-white font-bold py-3.5 rounded-lg transition-colors text-base shadow-sm"
                  >
                    Confirmar compra <ChevronRight className="w-5 h-5" />
                  </button>
                  <a
                    href={`https://wa.me/5491173670283?text=${encodeURIComponent('Hola Facundo! Mi carrito:\n' + waMessage)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
                  </a>
                </div>
              </>
            )}

            {/* ── PASO 2: Tipo de envío ── */}
            {step === 'envio' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-3">
                  {tiposEnvio.length === 0 ? (
                    <p className="text-gris-medio text-sm text-center py-8">No hay tipos de envío disponibles.</p>
                  ) : (
                    tiposEnvio.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTipoEnvio(t)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                          tipoEnvio?.id === t.id
                            ? 'border-rojo-principal bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tipoEnvio?.id === t.id ? 'bg-rojo-principal text-white' : 'bg-gris-fondo text-gris-medio'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{t.nombre}</p>
                        </div>
                        <span className={`font-bold text-sm shrink-0 ${t.costo === 0 ? 'text-green-600' : 'text-gris-oscuro'}`}>
                          {t.costo === 0 ? 'Gratis' : formatPrice(t.costo)}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Resumen de totales */}
                <div className="border-t px-6 py-4 space-y-3">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gris-medio">
                      <span>Subtotal productos</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {tipoEnvio && (
                      <div className="flex justify-between text-gris-medio">
                        <span>Envío ({tipoEnvio.nombre})</span>
                        <span className={costoEnvio === 0 ? 'text-green-600 font-medium' : ''}>
                          {costoEnvio === 0 ? 'Gratis' : formatPrice(costoEnvio)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-1 border-t">
                      <span>Total</span>
                      <span className="text-rojo-principal">{formatPrice(totalConEnvio)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setStep('nave')}
                      disabled={!tipoEnvio && tiposEnvio.length > 0}
                      className="flex items-center justify-center gap-2 w-full bg-rojo-principal hover:bg-rojo-hover disabled:opacity-50 text-white font-bold py-3.5 rounded-lg transition-colors text-base shadow-sm"
                    >
                      <CreditCard className="w-5 h-5" /> Pagar con tarjeta / QR
                    </button>
                    <div className="text-center">
                      <button onClick={() => setStep('contacto')}
                        className="text-xs text-gris-medio hover:text-gris-oscuro underline underline-offset-2 transition-colors">
                        ¿Preferís que te contactemos? Dejá tus datos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 3a: Formulario Nave ── */}
            {step === 'nave' && (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-6 py-5 space-y-4">
                <p className="text-sm text-gris-medio">Completá tus datos para continuar al pago seguro.</p>
                <form onSubmit={handleNave} className="space-y-3 flex-1 flex flex-col">
                  {(['nombre', 'email', 'telefono'] as const).map(f => (
                    <input key={f} required type={f === 'email' ? 'email' : 'text'}
                      placeholder={f === 'nombre' ? 'Nombre y apellido' : f === 'email' ? 'Email' : 'Teléfono'}
                      value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                  ))}
                  <div>
                    <textarea required rows={3}
                      placeholder="Dirección de envío"
                      value={form.direccion}
                      onChange={e => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" />
                    <p className="text-xs text-gris-medio mt-1">
                      Indicá calle y número, localidad y provincia. Explicá claramente cómo llegar (entre qué calles, color/tipo de casa, referencias) para asegurar la entrega.
                    </p>
                  </div>
                  {/* Resumen compacto */}
                  <div className="bg-gris-fondo rounded-lg px-4 py-3 text-sm space-y-1 mt-auto">
                    <div className="flex justify-between text-gris-medio">
                      <span>Subtotal productos</span><span>{formatPrice(total)}</span>
                    </div>
                    {tipoEnvio && (
                      <div className="flex justify-between text-gris-medio">
                        <span>Envío ({tipoEnvio.nombre})</span>
                        <span>{costoEnvio === 0 ? 'Gratis' : formatPrice(costoEnvio)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                      <span>Total a pagar</span>
                      <span className="text-rojo-principal">{formatPrice(totalConEnvio)}</span>
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded">{error}</p>}
                  <button type="submit" disabled={sending}
                    className="w-full bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {sending ? 'Generando pago...' : 'Ir al pago seguro'}
                  </button>
                </form>
              </div>
            )}

            {/* ── PASO 3b: Formulario Contacto ── */}
            {step === 'contacto' && (
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                <form onSubmit={handlePedido} className="space-y-3 flex flex-col h-full">
                  {(['nombre', 'email', 'telefono'] as const).map(f => (
                    <input key={f} required type={f === 'email' ? 'email' : 'text'}
                      placeholder={f === 'nombre' ? 'Nombre y apellido' : f === 'email' ? 'Email' : 'Teléfono'}
                      value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm" />
                  ))}
                  <textarea placeholder="Notas (opcional)" rows={2}
                    value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                  {/* Resumen compacto */}
                  <div className="bg-gris-fondo rounded-lg px-4 py-3 text-sm space-y-1 mt-auto">
                    <div className="flex justify-between text-gris-medio">
                      <span>Subtotal productos</span><span>{formatPrice(total)}</span>
                    </div>
                    {tipoEnvio && (
                      <div className="flex justify-between text-gris-medio">
                        <span>Envío ({tipoEnvio.nombre})</span>
                        <span>{costoEnvio === 0 ? 'Gratis' : formatPrice(costoEnvio)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-rojo-principal">{formatPrice(totalConEnvio)}</span>
                    </div>
                  </div>
                  <button type="submit" disabled={sending}
                    className="w-full bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors">
                    {sending ? 'Enviando...' : 'Confirmar pedido'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
