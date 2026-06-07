import { Truck, Banknote, ShieldCheck, CreditCard } from 'lucide-react'

export default function BeneficiosBar() {
  return (
    <div className="bg-rojo-principal text-white py-4">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 opacity-90 shrink-0" />
          <div>
            <p className="font-bold text-sm">Envíos</p>
            <p className="text-xs opacity-80">A todo el país</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Banknote className="w-8 h-8 opacity-90 shrink-0" />
          <div>
            <p className="font-bold text-sm">Descuento en Efectivo</p>
            <p className="text-xs opacity-80">10% de descuento</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 opacity-90 shrink-0" />
          <div>
            <p className="font-bold text-sm">3 o 6 cuotas sin interés</p>
            <p className="text-xs opacity-80">Visa y Mastercard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 opacity-90 shrink-0" />
          <div>
            <p className="font-bold text-sm">Garantía</p>
            <p className="text-xs opacity-80">En todos los productos</p>
          </div>
        </div>

      </div>
    </div>
  )
}
