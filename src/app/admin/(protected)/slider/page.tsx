import { prisma } from '@/lib/prisma'
import SliderAdmin from '@/components/admin/SliderAdmin'

export default async function AdminSliderPage() {
  const [items, config] = await Promise.all([
    prisma.sliderItem.findMany({ orderBy: { orden: 'asc' } }),
    prisma.configuracion.findUnique({ where: { id: 1 } }),
  ])
  return (
    <SliderAdmin
      items={items}
      config={{
        intervalo: config?.sliderIntervalo ?? 5,
        transicion: config?.sliderTransicion ?? 'fade',
      }}
    />
  )
}
