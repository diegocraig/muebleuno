'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OrdenSelector({ current }: { current: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const handleChange = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set('order', value)
    else p.delete('order')
    p.delete('page')
    router.push(`/productos?${p.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={e => handleChange(e.target.value)}
      className="border rounded px-3 py-1.5 text-sm"
    >
      <option value="">Más nuevos</option>
      <option value="precio_asc">Precio: menor a mayor</option>
      <option value="precio_desc">Precio: mayor a menor</option>
      <option value="nombre">Nombre A-Z</option>
    </select>
  )
}
