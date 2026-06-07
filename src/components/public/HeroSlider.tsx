'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SliderItem {
  id: number; imagen: string; titulo?: string | null; subtitulo?: string | null; linkUrl?: string | null
}

interface Props {
  items: SliderItem[]
  intervalo?: number
  transicion?: string
}

const PLACEHOLDER = [
  { id: 0, imagen: '', titulo: 'Muebles de Calidad para tu Hogar', subtitulo: 'Envíos a todo el país · Cuotas sin interés', linkUrl: '/productos' },
]

export default function HeroSlider({ items, intervalo = 5 }: Props) {
  const slides = items.length > 0 ? items : PLACEHOLDER
  const [current, setCurrent] = useState(0)
  const currentRef = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (idx === currentRef.current) return
    currentRef.current = idx
    setCurrent(idx)
  }, [])

  const next = useCallback(() => goTo((currentRef.current + 1) % slides.length), [slides.length, goTo])
  const back = useCallback(() => goTo((currentRef.current - 1 + slides.length) % slides.length), [slides.length, goTo])

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    if (slides.length <= 1) return
    autoPlayRef.current = setInterval(
      () => goTo((currentRef.current + 1) % slides.length),
      intervalo * 1000
    )
  }, [slides.length, intervalo, goTo])

  useEffect(() => {
    resetAutoPlay()
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current) }
  }, [resetAutoPlay])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
    setDragX(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    const c = currentRef.current
    // Resistencia en los extremos
    if ((c === 0 && diff > 0) || (c === slides.length - 1 && diff < 0)) {
      setDragX(diff * 0.2)
    } else {
      setDragX(diff)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    setIsDragging(false)
    setDragX(0)
    if (Math.abs(diff) > 50) diff > 0 ? next() : back()
    touchStartX.current = null
    resetAutoPlay()
  }

  return (
    <div
      className="relative w-full h-[350px] md:h-[580px] overflow-hidden bg-gris-oscuro"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Track */}
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(calc(-${current * (100 / slides.length)}% + ${dragX / slides.length}px))`,
          transition: isDragging ? 'none' : 'transform 600ms ease',
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative h-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
            {slide.imagen
              ? <img src={slide.imagen} alt={slide.titulo ?? ''} className="w-full h-full object-cover" />
              : <div className="absolute inset-0 bg-gradient-to-br from-rojo-principal to-gris-oscuro" />
            }
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-8 text-white">
                {slide.titulo && (
                  <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight max-w-2xl">{slide.titulo}</h1>
                )}
                {slide.subtitulo && (
                  <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl">{slide.subtitulo}</p>
                )}
                {slide.linkUrl && (
                  <Link href={slide.linkUrl} className="inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors">
                    VER PRODUCTOS
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button onClick={() => { back(); resetAutoPlay() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => { next(); resetAutoPlay() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { goTo(i); resetAutoPlay() }}
                className={`h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50 w-2.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
