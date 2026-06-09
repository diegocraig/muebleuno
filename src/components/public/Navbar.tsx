'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, Phone, ChevronRight, ChevronDown, Clock } from 'lucide-react'
import { useCart } from './CartProvider'
import CartDrawer from './CartDrawer'
import BuscadorLive from './BuscadorLive'

interface Subcategoria { id: number; nombre: string; slug: string }
interface Categoria { id: number; nombre: string; slug: string; tipoBoton?: string; urlPagina?: string | null; subcategorias: Subcategoria[] }

export default function Navbar() {
  const { count, setIsOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [expandedCat, setExpandedCat] = useState<number | null>(null)
  const [hoveredCat, setHoveredCat] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(setCategorias)
  }, [])

  const handleCatMouseEnter = (id: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setHoveredCat(id)
  }
  const handleCatMouseLeave = () => {
    closeTimer.current = setTimeout(() => setHoveredCat(null), 150)
  }

  return (
    <>
      {/* Top bar */}
      <div className="bg-gris-oscuro text-white text-sm py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="https://wa.me/5491173670283?text=Hola, quiero consultar sobre sus productos" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-rojo-suave transition-colors">
            <Phone className="w-3.5 h-3.5" /> Llamanos
          </a>
          <div className="hidden md:flex items-center gap-1.5 opacity-80">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Lun a Vie 8-12 / 14-17 &nbsp;·&nbsp; Sáb 9-12:30</span>
          </div>
          <span className="opacity-70">Envíos a todo el país</span>
        </div>
      </div>

      {/* Main nav */}
      <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="Mueble UNO" width={160} height={34} priority className="h-9 w-auto" />
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/productos" className="font-medium hover:text-rojo-principal transition-colors">Productos</Link>

            {/* Categorías dropdown */}
            <div className="relative group">
              <button className="font-medium hover:text-rojo-principal transition-colors">Categorías ▾</button>
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {categorias.map(cat => (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => handleCatMouseEnter(cat.id)}
                    onMouseLeave={handleCatMouseLeave}
                  >
                    {cat.subcategorias.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between px-4 py-2 hover:bg-gris-fondo hover:text-rojo-principal transition-colors cursor-default">
                          <Link href={cat.tipoBoton === 'pagina' && cat.urlPagina ? cat.urlPagina : `/categoria/${cat.slug}`} className="flex-1">
                            {cat.nombre}
                          </Link>
                          <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                        </div>
                        {/* Submenu */}
                        {hoveredCat === cat.id && (
                          <div
                            className="absolute left-full top-0 ml-0.5 bg-white shadow-lg rounded-lg py-2 w-48 z-50"
                            onMouseEnter={() => handleCatMouseEnter(cat.id)}
                            onMouseLeave={handleCatMouseLeave}
                          >
                            {cat.subcategorias.map(sub => (
                              <Link key={sub.id} href={`/subcategoria/${sub.slug}`}
                                className="block px-4 py-2 hover:bg-gris-fondo hover:text-rojo-principal transition-colors text-sm">
                                {sub.nombre}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={cat.tipoBoton === 'pagina' && cat.urlPagina ? cat.urlPagina : `/categoria/${cat.slug}`}
                        className="block px-4 py-2 hover:bg-gris-fondo hover:text-rojo-principal transition-colors">
                        {cat.nombre}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Link href="/novedades" className="font-medium hover:text-rojo-principal transition-colors">Novedades</Link>
            <Link href="/promociones" className="font-medium hover:text-rojo-principal transition-colors">Promociones</Link>
            <Link href="/muebles-a-medida" className="font-medium hover:text-rojo-principal transition-colors whitespace-nowrap">Muebles a Medida</Link>
            <Link href="/quienes-somos" className="font-medium hover:text-rojo-principal transition-colors">Quiénes Somos</Link>
            <Link href="/contacto" className="font-medium hover:text-rojo-principal transition-colors">Contacto</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <BuscadorLive />
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 hover:text-rojo-principal transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-rojo-principal text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t bg-white px-4 py-4 space-y-1">
            {categorias.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between">
                  <Link href={cat.tipoBoton === 'pagina' && cat.urlPagina ? cat.urlPagina : `/categoria/${cat.slug}`}
                    className="flex-1 py-2 hover:text-rojo-principal transition-colors"
                    onClick={() => { if (!cat.subcategorias.length) setMenuOpen(false) }}>
                    {cat.nombre}
                  </Link>
                  {cat.subcategorias.length > 0 && (
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      className="p-2 hover:text-rojo-principal transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedCat === cat.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {expandedCat === cat.id && cat.subcategorias.length > 0 && (
                  <div className="pl-4 space-y-1 pb-1">
                    {cat.subcategorias.map(sub => (
                      <Link key={sub.id} href={`/subcategoria/${sub.slug}`}
                        className="block py-1.5 text-sm text-gris-medio hover:text-rojo-principal transition-colors"
                        onClick={() => setMenuOpen(false)}>
                        {sub.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2 space-y-1 border-t mt-2">
              <Link href="/novedades" className="block py-2 hover:text-rojo-principal" onClick={() => setMenuOpen(false)}>Novedades</Link>
              <Link href="/promociones" className="block py-2 hover:text-rojo-principal" onClick={() => setMenuOpen(false)}>Promociones</Link>
              <Link href="/muebles-a-medida" className="block py-2 hover:text-rojo-principal font-semibold" onClick={() => setMenuOpen(false)}>Muebles a Medida</Link>
              <Link href="/quienes-somos" className="block py-2 hover:text-rojo-principal" onClick={() => setMenuOpen(false)}>Quiénes Somos</Link>
              <Link href="/contacto" className="block py-2 hover:text-rojo-principal" onClick={() => setMenuOpen(false)}>Contacto</Link>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  )
}
