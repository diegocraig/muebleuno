import Link from 'next/link'
import { Layers } from 'lucide-react'

interface Categoria {
  id: number; nombre: string; slug: string; imagen?: string | null
  _count?: { productos: number }
}

export default function CategoriaGrid({ categorias }: { categorias: Categoria[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categorias.map(cat => (
        <Link key={cat.id} href={`/categoria/${cat.slug}`}
          className="group flex flex-col items-center p-4 rounded-xl border-2 border-transparent hover:border-rojo-principal transition-all bg-gris-fondo hover:bg-rojo-suave">
          <div className="w-[134px] h-[134px] rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm overflow-hidden">
            {cat.imagen ? (
              <img src={cat.imagen} alt={cat.nombre} className="w-full h-full object-cover" />
            ) : (
              <Layers className="w-10 h-10 text-rojo-principal" />
            )}
          </div>
          <p className="font-semibold text-sm text-center uppercase group-hover:text-rojo-principal transition-colors">{cat.nombre}</p>
          {cat._count && (
            <p className="text-xs text-gris-medio mt-0.5">{cat._count.productos} productos</p>
          )}
        </Link>
      ))}
    </div>
  )
}
