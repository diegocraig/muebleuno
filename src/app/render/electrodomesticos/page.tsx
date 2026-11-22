import Link from 'next/link'
import Image from 'next/image'
import { listarElectros } from '@/lib/render/servidor'
import ElectrosAdmin from './ElectrosAdmin'

export default async function ElectrosPage() {
  const electros = await listarElectros()
  return (
    <div className="min-h-screen bg-gris-fondo">
      <header className="flex h-14 items-center gap-3 border-b border-gray-100 bg-white px-4 shadow-sm">
        <Link href="/render"><Image src="/logo.png" alt="Mueble UNO" width={130} height={28} className="h-7 w-auto" /></Link>
        <span className="rounded bg-rojo-suave px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rojo-principal">Render · electrodomésticos</span>
        <Link href="/render" className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-gris-medio hover:bg-gris-fondo">← Volver al editor</Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Base de medidas de electrodomésticos</h1>
        <p className="mb-6 mt-1 text-sm text-gris-medio">
          Medidas en cm (ancho × alto × profundidad). <span className="text-green-700">✓</span> = tomadas de la ficha técnica (fabricante o retailer, link en “fuente”);
          “ref.” = medida nominal genérica. Antes de fabricar, confirmá siempre con la ficha del modelo exacto.
        </p>
        <ElectrosAdmin inicial={electros} />
      </main>
    </div>
  )
}
