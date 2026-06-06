'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Categoria { id: number; nombre: string; slug: string }
interface Props {
  categorias: Categoria[]
  searchParams: Record<string, string | undefined>
}

export default function FiltroSidebar({ categorias, searchParams }: Props) {
  const router = useRouter()
  const [categoria, setCategoria] = useState(searchParams.categoria ?? '')
  const [precioMin, setPrecioMin] = useState(searchParams.precio_min ?? '')
  const [precioMax, setPrecioMax] = useState(searchParams.precio_max ?? '')
  const [oferta, setOferta] = useState(searchParams.oferta === 'true')
  const [novedad, setNovedad] = useState(searchParams.novedad === 'true')

  const aplicar = () => {
    const p = new URLSearchParams()
    if (categoria) p.set('categoria', categoria)
    if (precioMin) p.set('precio_min', precioMin)
    if (precioMax) p.set('precio_max', precioMax)
    if (oferta) p.set('oferta', 'true')
    if (novedad) p.set('novedad', 'true')
    router.push(`/productos?${p.toString()}`)
  }

  const limpiar = () => {
    setCategoria(''); setPrecioMin(''); setPrecioMax(''); setOferta(false); setNovedad(false)
    router.push('/productos')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold mb-3">Categoría</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="cat" value="" checked={categoria === ''} onChange={() => setCategoria('')} />
            <span className="text-sm">Todas</span>
          </label>
          {categorias.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="cat" value={cat.slug} checked={categoria === cat.slug} onChange={() => setCategoria(cat.slug)} />
              <span className="text-sm">{cat.nombre}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">Precio</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={precioMin} onChange={e => setPrecioMin(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm" />
          <input type="number" placeholder="Max" value={precioMax} onChange={e => setPrecioMax(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={oferta} onChange={e => setOferta(e.target.checked)} />
          <span className="text-sm font-medium">Solo ofertas</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={novedad} onChange={e => setNovedad(e.target.checked)} />
          <span className="text-sm font-medium">Solo novedades</span>
        </label>
      </div>

      <div className="space-y-2">
        <button onClick={aplicar} className="w-full bg-rojo-principal text-white font-semibold py-2.5 rounded-lg hover:bg-rojo-hover transition-colors text-sm">
          Aplicar filtros
        </button>
        <button onClick={limpiar} className="w-full border text-gris-medio font-semibold py-2.5 rounded-lg hover:bg-gris-fondo transition-colors text-sm">
          Limpiar
        </button>
      </div>
    </div>
  )
}
