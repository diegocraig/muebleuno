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

// active  = slide entrante (se mueve hacia posición visible)
// leaving = slide saliente (se mueve hacia fuera con transición)
// resto   = fuera de pantalla sin transición (listo para entrar)
function getClasses(t: string, active: boolean, leaving: boolean) {
  const b = 'absolute inset-0'
  if (t === 'fade') {
    if (active)  return `${b} transition-opacity duration-700 opacity-100 z-10`
    if (leaving) return `${b} transition-opacity duration-700 opacity-0 z-20`  // encima, se desvanece
    return `${b} opacity-0 z-0`
  }
  if (t === 'slide') {
    if (active)  return `${b} transition-transform duration-700 translate-x-0 z-10`
    if (leaving) return `${b} transition-transform duration-700 -translate-x-full z-10`
    return `${b} translate-x-full z-0`   // esperando fuera a la derecha, sin transición
  }
  if (t === 'zoom') {
    if (active)  return `${b} transition-all duration-700 scale-100 opacity-100 z-10`
    if (leaving) return `${b} transition-all duration-700 scale-110 opacity-0 z-10`
    return `${b} scale-100 opacity-0 z-0`
  }
  if (t === 'push') {
    if (active)  return `${b} transition-transform duration-500 translate-y-0 z-10`
    if (leaving) return `${b} transition-transform duration-500 -translate-y-full z-10`
    return `${b} translate-y-full z-0`
  }
  // fallback fade
  if (active)  return `${b} transition-opacity duration-700 opacity-100 z-10`
  if (leaving) return `${b} transition-opacity duration-700 opacity-0 z-20`
  return `${b} opacity-0 z-0`
}

export default function HeroSlider({ items, intervalo = 5, transicion = 'fade' }: Props) {
  const slides = items.length > 0 ? items : PLACEHOLDER
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const currentRef = useRef(0)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback((idx: number) => {
    const c = currentRef.current
    if (idx === c) return
    setPrev(c)
    currentRef.current = idx
    setCurrent(idx)
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(() => setPrev(null), 750)
  }, [])

  const next = useCallback(() => goTo((currentRef.current + 1) % slides.length), [slides.length, goTo])
  const back = useCallback(() => goTo((currentRef.current - 1 + slides.length) % slides.length), [slides.length, goTo])

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : back()
    touchStartX.current = null
  }

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => goTo((currentRef.current + 1) % slides.length), intervalo * 1000)
    return () => clearInterval(t)
  }, [slides.length, intervalo, goTo])

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current) }, [])

  return (
    <div
      className="relative w-full h-[480px] md:h-[580px] overflow-hidden bg-gris-oscuro"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, idx) => (
        <div key={slide.id} className={getClasses(transicion, idx === current, idx === prev)}>
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

      {slides.length > 1 && (
        <>
          <button onClick={back} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50 w-2.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
