const TIPOS = ['cocina', 'anafe', 'horno', 'heladera', 'microondas', 'campana', 'lavavajillas', 'bacha', 'lavarropas']
const ACABADOS = ['inox', 'blanco', 'negro', 'gris', 'otro']

const cm = (v: unknown, min = 1, max = 400) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null
}

export function validarElectro(body: unknown) {
  if (!body || typeof body !== 'object') return { error: 'Cuerpo inválido' } as const
  const b = body as Record<string, unknown>
  const tipo = String(b.tipo)
  if (!TIPOS.includes(tipo)) return { error: 'Tipo inválido' } as const
  const marca = String(b.marca ?? '').trim().slice(0, 60)
  const modelo = String(b.modelo ?? '').trim().slice(0, 120)
  if (!marca || !modelo) return { error: 'Marca y modelo son obligatorios' } as const
  const ancho = cm(b.ancho), alto = cm(b.alto), profundidad = cm(b.profundidad)
  if (!ancho || !alto || !profundidad) return { error: 'Medidas inválidas (cm entre 1 y 400)' } as const
  const fuente = typeof b.fuente === 'string' && /^https?:\/\//.test(b.fuente) ? b.fuente.slice(0, 500) : null
  const precio = Number(b.precio)
  return {
    data: {
      tipo, marca, modelo, ancho, alto, profundidad,
      caladoAncho: cm(b.caladoAncho), caladoProf: cm(b.caladoProf),
      acabado: ACABADOS.includes(String(b.acabado)) ? String(b.acabado) : 'inox',
      empotrable: !!b.empotrable,
      precio: Number.isFinite(precio) && precio > 0 ? precio : null,
      fuente,
      verificado: !!b.verificado,
    },
  } as const
}
