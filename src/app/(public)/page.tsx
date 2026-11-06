import { prisma } from '@/lib/prisma'
import { INCLUDE_COLORES } from '@/lib/coloresServer'
import HeroSlider from '@/components/public/HeroSlider'
import BeneficiosBar from '@/components/public/BeneficiosBar'
import CategoriaGrid from '@/components/public/CategoriaGrid'
import ProductoGrid from '@/components/public/ProductoGrid'
import BannerDestacado from '@/components/public/BannerDestacado'
import PromoPopup from '@/components/public/PromoPopup'
import { promo12CuotasActiva } from '@/lib/promos'

export const dynamic = 'force-dynamic'

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
      {promo12CuotasActiva() && (
        <PromoPopup
          src="/promos/12-cuotas-6-y-7-noviembre.webp"
          alt="Viernes 6 y sábado 7: 12 cuotas sin interés en nuestro local y en la web. Solo productos standard, no incluye muebles a medida"
          width={900}
          height={1600}
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
