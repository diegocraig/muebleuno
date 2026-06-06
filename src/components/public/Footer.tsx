import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gris-oscuro text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-black text-rojo-principal mb-4">MUEBLE UNO</h3>
          <p className="text-sm text-gris-claro leading-relaxed">
            Tu mueblería de confianza en El Palomar, Buenos Aires. Calidad, diseño y los mejores precios.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Categorías</h4>
          <ul className="space-y-2 text-sm text-gris-claro">
            {['Living', 'Dormitorio', 'Comedor', 'Cocina', 'Oficina'].map(c => (
              <li key={c}>
                <Link href={`/categoria/${c.toLowerCase()}`} className="hover:text-white transition-colors">{c}</Link>
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
            <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
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
            <li>
              <a href="tel:01144606272" className="hover:text-white transition-colors">
                📞 (011) 4460-6272
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
