'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt: string
  width: number
  height: number
}

const SALIDA_MS = 220

export default function PromoPopup({ src, alt, width, height }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  // Se muestra en cada carga de la portada.
  useEffect(() => {
    const t = setTimeout(() => setAbierto(true), 700)
    return () => clearTimeout(t)
  }, [])

  const cerrar = useCallback(() => {
    setSaliendo(true)
    setTimeout(() => {
      setAbierto(false)
      setSaliendo(false)
    }, SALIDA_MS)
  }, [])

  useEffect(() => {
    if (!abierto) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto, cerrar])

  if (!abierto) return null

  return (
    // Cualquier click (fondo, imagen o botón) cierra el popup.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={cerrar}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 p-4 backdrop-blur-sm cursor-pointer ${
        saliendo ? 'promo-fondo-salida' : 'promo-fondo-entrada'
      }`}
    >
      <div className={`relative ${saliendo ? 'promo-caja-salida' : 'promo-caja-entrada'}`}>
        {/* Marco: borde degradé rojo/dorado + paspartú blanco */}
        <div className="rounded-[1.75rem] bg-gradient-to-br from-[#C0272D] via-[#E9C46A] to-[#C0272D] p-[3px] shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)]">
          <div className="rounded-[1.6rem] bg-white p-2 sm:p-3">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              priority
              sizes="(max-width: 640px) 92vw, 540px"
              className="block h-auto w-auto rounded-2xl"
              style={{
                maxWidth: 'min(86vw, 540px)',
                maxHeight: 'calc(100dvh - 9rem)',
              }}
            />
          </div>
        </div>

        <button
          ref={cerrarRef}
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-rojo-principal text-white shadow-lg ring-4 ring-white transition-transform hover:scale-110 hover:bg-rojo-hover focus:outline-none focus-visible:ring-[#E9C46A] sm:-right-4 sm:-top-4 sm:h-14 sm:w-14"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <p className="promo-pista mt-4 select-none text-center text-sm font-medium text-white/90">
        Tocá en cualquier lugar para cerrar
      </p>
    </div>
  )
}
