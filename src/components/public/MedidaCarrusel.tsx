'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Foto { id: number; imagen: string; titulo: string | null }

export default function MedidaCarrusel({ fotos }: { fotos: Foto[] }) {
  const [idx, setIdx] = useState(0)
  if (!fotos.length) return null
  const prev = () => setIdx(i => (i - 1 + fotos.length) % fotos.length)
  const next = () => setIdx(i => (i + 1) % fotos.length)
  const foto = fotos[idx]

  return (
    <section className="py-16 px-4 bg-gris-oscuro">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-white text-center mb-2">Nuestros trabajos</h2>
        <p className="text-center text-gris-claro mb-8">Algunos de los proyectos realizados</p>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto.imagen} alt={foto.titulo ?? `Foto ${idx + 1}`} className="w-full h-full object-contain" />
          {foto.titulo && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-4 py-2 text-center">{foto.titulo}</div>
          )}
          {fotos.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        {fotos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {fotos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === idx ? 'bg-rojo-principal' : 'bg-white/30 hover:bg-white/60'}`} />
            ))}
          </div>
        )}
        {fotos.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center">
            {fotos.map((f, i) => (
              <button key={f.id} onClick={() => setIdx(i)}
                className={`shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-colors ${i === idx ? 'border-rojo-principal' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.imagen} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
