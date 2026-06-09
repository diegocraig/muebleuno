'use client'
import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface Producto {
  id: number; nombre: string; slug: string; precio: number; imagenes: string;
  categoria: { nombre: string }
}

export default function BuscadorLive() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Producto[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      setOpen(false)
      router.push(`/productos?buscar=${encodeURIComponent(query.trim())}`)
    }
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (q: string) => {
    setQuery(q)
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
      setLoading(false)
    }, 300)
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <div className="flex items-center border rounded-lg px-3 py-1.5 gap-2 w-52 focus-within:border-rojo-principal transition-colors">
        <Search className="w-4 h-4 text-gris-claro shrink-0" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm outline-none w-full bg-transparent"
        />
      </div>
      {open && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-white shadow-xl rounded-lg border z-50 overflow-hidden">
          {loading && <p className="p-4 text-sm text-gris-medio">Buscando...</p>}
          {!loading && results.length === 0 && (
            <p className="p-4 text-sm text-gris-medio">No se encontraron resultados</p>
          )}
          {!loading && results.map(p => {
            const imgs = JSON.parse(p.imagenes || '[]')
            return (
              <Link key={p.id} href={`/productos/${p.slug}`}
                onClick={() => { setOpen(false); setQuery('') }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gris-fondo transition-colors">
                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                  {imgs[0] && <img src={imgs[0]} alt={p.nombre} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{p.nombre}</p>
                  <p className="text-xs text-gris-medio">{p.categoria.nombre}</p>
                  <p className="text-sm font-bold text-gray-400">{formatPrice(p.precio)}</p>
                  <p className="text-sm font-bold text-rojo-principal">6 cuotas de {formatPrice(Math.ceil(p.precio / 6))}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
