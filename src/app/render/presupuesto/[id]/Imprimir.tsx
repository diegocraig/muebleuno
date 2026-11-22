'use client'
import { Printer } from 'lucide-react'

export default function Imprimir() {
  return (
    <div className="mx-auto mt-4 flex max-w-3xl justify-end print:hidden">
      <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-rojo-principal px-4 py-2 text-sm font-semibold text-white hover:bg-rojo-hover">
        <Printer className="h-4 w-4" /> Imprimir / guardar PDF
      </button>
    </div>
  )
}
