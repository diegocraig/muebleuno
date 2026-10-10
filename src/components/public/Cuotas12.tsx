import { formatPrice } from '@/lib/utils'
import { promo12CuotasActiva } from '@/lib/promos'

// Promo temporal: 12 cuotas sin interés. Se oculta sola al vencer (ver src/lib/promos.ts).
export default function Cuotas12({ precio, size = 'sm' }: { precio: number; size?: 'sm' | 'base' }) {
  if (!promo12CuotasActiva()) return null
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className={`${size === 'base' ? 'text-base' : 'text-sm'} font-bold text-rojo-principal leading-tight`}>
        Ahora también 12 cuotas sin interés de {formatPrice(Math.ceil(precio / 12))}
      </p>
      <span className="inline-block bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded animate-pulse">
        Por tiempo limitado
      </span>
    </div>
  )
}
