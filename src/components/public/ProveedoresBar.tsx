const LOGOS = [
  { src: '/muebleuno/proveedores/egger.png', alt: 'Egger' },
  { src: '/muebleuno/proveedores/faplac.png', alt: 'Faplac' },
  { src: '/muebleuno/proveedores/haefele.png', alt: 'Häfele' },
  { src: '/muebleuno/proveedores/vesto.png', alt: 'Vesto' },
]

export default function ProveedoresBar() {
  return (
    <div className="bg-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gris-medio mb-8">
          Fabricamos nuestros muebles con proveedores de primer nivel
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {LOGOS.map(logo => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              className="h-10 w-auto object-contain grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
