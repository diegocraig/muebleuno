'use client'
import { useRouter } from 'next/navigation'

export default function BorrarProyecto({ id, nombre }: { id: number; nombre: string }) {
  const router = useRouter()
  return (
    <button type="button" className="font-semibold text-gris-claro hover:text-red-600" onClick={async () => {
      if (!confirm(`¿Borrar el proyecto "${nombre}"? No se puede deshacer.`)) return
      await fetch(`/api/render/proyectos/${id}`, { method: 'DELETE' })
      router.refresh()
    }}>Borrar</button>
  )
}
