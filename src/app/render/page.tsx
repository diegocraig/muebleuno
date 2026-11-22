import { prisma } from '@/lib/prisma'
import { catalogoCocina, listarElectros, tiposEnvio } from '@/lib/render/servidor'
import RenderApp, { type ProyectoInicial } from '@/components/render/RenderApp'
import type { DatosProyecto } from '@/lib/render/tipos'

export default async function RenderPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  const [catalogo, electros, envios] = await Promise.all([catalogoCocina(), listarElectros(), tiposEnvio()])

  let inicial: ProyectoInicial | null = null
  if (p && Number(p) > 0) {
    const fila = await prisma.renderProyecto.findUnique({ where: { id: Number(p) } })
    if (fila) {
      inicial = {
        id: fila.id,
        datos: JSON.parse(fila.datos),
        presupuesto: JSON.parse(fila.presupuesto || '{}'),
        proyecto: {
          id: fila.id,
          nombre: fila.nombre,
          cliente: fila.cliente ?? '',
          email: fila.email ?? '',
          telefono: fila.telefono ?? '',
          estado: fila.estado as DatosProyecto['estado'],
          pedidoId: fila.pedidoId,
        },
      }
    }
  }
  return <RenderApp catalogo={catalogo} electros={electros} envios={envios} inicial={inicial} />
}
