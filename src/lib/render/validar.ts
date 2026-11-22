import type { Escena } from './tipos'
import { normalizarPresupuesto } from './escena'

const MAX_DATOS = 2_000_000
const MAX_CAPTURA = 900_000
const texto = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Valida y normaliza el cuerpo de guardado de un proyecto de /render. */
export function validarProyecto(body: unknown) {
  if (!body || typeof body !== 'object') return { error: 'Cuerpo inválido' } as const
  const b = body as Record<string, unknown>
  const esc = b.datos as Escena | undefined
  if (!esc || esc.version !== 1 || !Array.isArray(esc.items)) return { error: 'La escena no es válida' } as const
  const datos = JSON.stringify(esc)
  if (datos.length > MAX_DATOS) return { error: 'La escena es demasiado grande' } as const
  const presupuesto = JSON.stringify(normalizarPresupuesto(b.presupuesto))
  let captura: string | null = null
  if (typeof b.captura === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(b.captura)) {
    if (b.captura.length > MAX_CAPTURA) return { error: 'La captura es demasiado grande' } as const
    captura = b.captura
  }
  const estado = ['borrador', 'presupuesto'].includes(String(b.estado)) ? String(b.estado) : 'borrador'
  return {
    data: {
      nombre: texto(b.nombre) || 'Cocina sin nombre',
      cliente: texto(b.cliente) || null,
      email: texto(b.email) || null,
      telefono: texto(b.telefono, 60) || null,
      datos,
      presupuesto: presupuesto.length > 200_000 ? '{}' : presupuesto,
      total: Number.isFinite(Number(b.total)) ? Math.max(0, Number(b.total)) : 0,
      estado,
      ...(captura ? { captura } : {}),
    },
  } as const
}
