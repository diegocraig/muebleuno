import { prisma } from '@/lib/prisma'
import { INCLUDE_COLORES } from '@/lib/coloresServer'
import HeroSlider from '@/components/public/HeroSlider'
import BeneficiosBar from '@/components/public/BeneficiosBar'
import CategoriaGrid from '@/components/public/CategoriaGrid'
import ProductoGrid from '@/components/public/ProductoGrid'
import BannerDestacado from '@/components/public/BannerDestacado'
import PromoPopup from '@/components/public/PromoPopup'

export const dynamic = 'force-dynamic'

// Popup "Día de la Madre": se deja de mostrar solo al terminar el 18/10 (hora Argentina).
const PROMO_HASTA = Date.parse('2026-10-19T00:00:00-03:00')

async function getData() {
  const [sliderItems, categorias, destacados, novedades, config] = await Promise.all([
    prisma.sliderItem.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.categoria.findMany({ where: { activa: true }, orderBy: { orden: 'asc' }, include: { _count: { select: { productos: true } } } }),
    prisma.producto.findMany({ where: { activo: true, destacado: true }, include: { categoria: true, ...INCLUDE_COLORES }, take: 8, orderBy: { creadoEn: 'desc' } }),
    prisma.producto.findMany({ where: { activo: true, novedad: true }, include: { categoria: true, ...INCLUDE_COLORES }, take: 8, orderBy: { creadoEn: 'desc' } }),
    prisma.configuracion.findUnique({ where: { id: 1 } }),
  ])
  return { sliderItems, categorias, destacados, novedades, config }
}

export default async function HomePage() {
  const { sliderItems, categorias, destacados, novedades, config } = await getData()

  return (
    <>
      {Date.now() < PROMO_HASTA && (
        <PromoPopup
          src="/promos/dia-de-la-madre-2026.webp"
          alt="Feliz Día de la Madre — 12 cuotas sin interés en la web y 10% off en stock del local, del 11/10 al 18/10"
          width={1122}
          height={1402}
        />
      )}
      <HeroSlider items={sliderItems} intervalo={config?.sliderIntervalo ?? 5} transicion={config?.sliderTransicion ?? 'fade'} />
      <BeneficiosBar />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gris-oscuro mb-8">Categorías</h2>
        <CategoriaGrid categorias={categorias} />
      </section>
      <BannerDestacado />
      {destacados.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gris-oscuro mb-8">Productos Destacados</h2>
          <ProductoGrid productos={destacados} />
        </section>
      )}
      {novedades.length > 0 && (
        <section className="bg-gris-fondo py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gris-oscuro mb-8">Novedades</h2>
            <ProductoGrid productos={novedades} />
          </div>
        </section>
      )}
    </>
  )
}
