import { formatPrice } from '@/lib/utils'

// Promo temporal: 12 cuotas sin interés. Para quitarla, borrar los <Cuotas12 /> (o devolver null acá).
export default function Cuotas12({ precio, size = 'sm' }: { precio: number; size?: 'sm' | 'base' }) {
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
