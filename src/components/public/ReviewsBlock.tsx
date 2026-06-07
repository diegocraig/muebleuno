import { Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'

interface Review {
  id: number; autor: string; ciudad?: string | null; texto: string; rating: number; creadaEn: Date
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-4 h-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-3">
      <Stars rating={review.rating} />
      <p className="text-sm text-gris-medio leading-relaxed flex-1">&ldquo;{review.texto}&rdquo;</p>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <div className="w-8 h-8 rounded-full bg-rojo-principal/10 flex items-center justify-center shrink-0">
          <span className="text-rojo-principal text-xs font-bold">
            {review.autor.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gris-oscuro">{review.autor}</p>
          {review.ciudad && <p className="text-xs text-gris-claro">{review.ciudad}</p>}
        </div>
      </div>
    </div>
  )
}

const TOTAL = 3

export default async function ReviewsBlock({ productoId }: { productoId?: number }) {
  const especificas = productoId
    ? await prisma.review.findMany({
        where: { activa: true, productoId },
        orderBy: { creadaEn: 'desc' },
        take: TOTAL,
      })
    : []

  const faltantes = TOTAL - especificas.length
  const generales = faltantes > 0
    ? await prisma.review.findMany({
        where: { activa: true, productoId: null },
        orderBy: { creadaEn: 'desc' },
        take: faltantes,
      })
    : []

  const reviews = [...especificas, ...generales]

  if (reviews.length === 0) return null

  const promedio = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <section className="mt-14">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gris-oscuro">Opiniones de clientes</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={`w-4 h-4 ${n <= Math.round(promedio) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-sm text-gris-medio">
              {promedio.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </section>
  )
}
