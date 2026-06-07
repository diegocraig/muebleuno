import { prisma } from '@/lib/prisma'
import ReviewsAdmin from '@/components/admin/ReviewsAdmin'

export default async function AdminReviewsPage() {
  const [reviews, productos] = await Promise.all([
    prisma.review.findMany({ orderBy: { creadaEn: 'desc' } }),
    prisma.producto.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
  ])
  return <ReviewsAdmin reviews={reviews as any} productos={productos} />
}
