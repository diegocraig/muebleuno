'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PRESETS: { key: string; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'anio', label: 'Este año' },
  { key: 'custom', label: 'Entre fechas' },
]

export default function DashboardFiltro() {
  const router = useRouter()
  const params = useSearchParams()
  const periodo = params.get('periodo') ?? 'mes'
  const [desde, setDesde] = useState(params.get('desde') ?? '')
  const [hasta, setHasta] = useState(params.get('hasta') ?? '')

  const irA = (p: string) => router.push(`/admin?periodo=${p}`)

  const aplicarCustom = () => {
    if (!desde || !hasta) return
    router.push(`/admin?periodo=custom&desde=${desde}&hasta=${hasta}`)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => (p.key === 'custom' ? router.push('/admin?periodo=custom') : irA(p.key))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              periodo === p.key
                ? 'bg-rojo-principal text-white border-rojo-principal'
                : 'bg-white text-gris-medio border-gray-200 hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 mt-3 bg-white rounded-lg border border-gray-200 p-3">
          <label className="text-sm">
            <span className="block text-gris-medio mb-1">Desde</span>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm" />
          </label>
          <label className="text-sm">
            <span className="block text-gris-medio mb-1">Hasta</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm" />
          </label>
          <button onClick={aplicarCustom} disabled={!desde || !hasta}
            className="bg-rojo-principal hover:bg-rojo-hover disabled:opacity-50 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
