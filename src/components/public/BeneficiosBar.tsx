import { Truck, Banknote, ShieldCheck } from 'lucide-react'

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 20" className="h-5 w-auto" aria-label="Visa">
      <rect width="48" height="20" rx="3" fill="white" fillOpacity="0.15" />
      <text x="24" y="14" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="11" fill="white" letterSpacing="1">VISA</text>
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-label="Mastercard">
      <circle cx="14" cy="12" r="10" fill="#EB001B" fillOpacity="0.85" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" fillOpacity="0.85" />
      <path d="M19 5.6a10 10 0 0 1 0 12.8A10 10 0 0 1 19 5.6z" fill="#FF5F00" fillOpacity="0.7" />
    </svg>
  )
}

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
            <p className="text-xs opacity-80">10% de descuento en efectivo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center gap-1.5">
            <VisaLogo />
            <MastercardLogo />
          </div>
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
