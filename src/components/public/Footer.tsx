import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Footer() {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: 'asc' },
    select: { nombre: true, slug: true },
  })

  return (
    <footer className="bg-gris-oscuro text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div>
          <h3 className="text-xl font-black text-rojo-principal mb-4">MUEBLE UNO</h3>
          <p className="text-sm text-gris-claro leading-relaxed">
            Tu mueblería de confianza en El Palomar, Buenos Aires. Calidad, diseño y los mejores precios.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Categorías</h4>
          <ul className="space-y-2 text-sm text-gris-claro">
            {categorias.map(c => (
              <li key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className="hover:text-white transition-colors">{c.nombre}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Más info</h4>
          <ul className="space-y-2 text-sm text-gris-claro">
            <li><Link href="/quienes-somos" className="hover:text-white transition-colors">Quiénes Somos</Link></li>
            <li><Link href="/novedades" className="hover:text-white transition-colors">Novedades</Link></li>
            <li><Link href="/promociones" className="hover:text-white transition-colors">Promociones</Link></li>
            <li><Link href="/muebles-a-medida" className="hover:text-white transition-colors">Muebles a Medida</Link></li>
            <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Redes Sociales</h4>
          <ul className="space-y-3 text-sm text-gris-claro">
            <li>
              <a href="https://www.instagram.com/muebleuno_/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @muebleuno_
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/uno.mueble1" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Mueble UNO
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Contacto</h4>
          <ul className="space-y-2 text-sm text-gris-claro">
            <li>
              <a
                href="https://maps.app.goo.gl/Qd5kPuSHchmWTmFi9"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                📍 Doidamia Palacios 1468<br />
                <span className="pl-5">El Palomar, Buenos Aires</span>
              </a>
            </li>
            <li className="pt-1">
              <p className="text-xs text-gris-claro/70 mb-1.5">WhatsApp:</p>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://wa.me/5491126484463?text=Hola, quiero consultar sobre sus productos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs hover:text-white transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                  Irupé: 11 2648-4463
                </a>
                <a
                  href="https://wa.me/5491173670283?text=Hola, quiero consultar sobre sus productos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs hover:text-white transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                  Facundo: 11 7367-0283
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-gris-claro">
        © {new Date().getFullYear()} Mueble UNO. Todos los derechos reservados.
      </div>
    </footer>
  )
}
