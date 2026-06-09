import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function PagoExitosoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gris-fondo px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">¡Pago recibido!</h1>
        <p className="text-gris-medio mb-6">
          Tu pedido fue confirmado. Nos contactaremos a la brevedad para coordinar la entrega.
        </p>
        <Link href="/" className="inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-8 py-3 rounded-lg transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
