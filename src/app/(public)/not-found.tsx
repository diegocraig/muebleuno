import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-rojo-principal/10 flex items-center justify-center">
            <SearchX className="w-10 h-10 text-rojo-principal" />
          </div>
        </div>
        <h1 className="text-6xl font-black text-gris-oscuro mb-2">404</h1>
        <h2 className="text-xl font-bold text-gris-oscuro mb-3">Página no encontrada</h2>
        <p className="text-gris-medio mb-8 leading-relaxed">
          La página que buscás no existe o fue movida. Podés volver al inicio o explorar nuestro catálogo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Ir al inicio
          </Link>
          <Link href="/productos"
            className="border border-gris-claro hover:border-rojo-principal hover:text-rojo-principal text-gris-oscuro font-bold px-6 py-3 rounded-xl transition-colors">
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
