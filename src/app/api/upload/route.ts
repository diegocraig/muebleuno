import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const MAX_BYTES = 20 * 1024 * 1024   // 20 MB — límite server-side
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

// Ajustes de procesamiento según contexto
const CTX_CONFIG: Record<string, { maxW: number; maxH: number; quality: number }> = {
  producto:  { maxW: 1200, maxH: 1200, quality: 88 },
  categoria: { maxW:  600, maxH:  600, quality: 88 },
  slider:    { maxW: 1920, maxH:  900, quality: 92 },
}
const DEFAULT_CONFIG = CTX_CONFIG.producto

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ctx = req.nextUrl.searchParams.get('ctx') ?? 'producto'
  const config = CTX_CONFIG[ctx] ?? DEFAULT_CONFIG

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Error al leer el formulario' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No hay archivo' }, { status: 400 })

  // Validar tipo MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo de archivo no permitido: ${file.type || 'desconocido'}. Usá JPG, PNG o WEBP.` },
      { status: 415 }
    )
  }

  // Leer buffer
  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo' }, { status: 400 })
  }

  // Validar tamaño
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `El archivo supera el límite de ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 413 }
    )
  }

  // Procesar con Sharp
  let resized: Buffer
  try {
    resized = await sharp(buffer)
      .resize(config.maxW, config.maxH, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: config.quality, mozjpeg: true })
      .toBuffer()
  } catch (err) {
    console.error('[upload] sharp error:', err)
    return NextResponse.json(
      { error: 'El archivo no es una imagen válida o está dañado' },
      { status: 422 }
    )
  }

  // Guardar archivo
  const filename = `${uuidv4()}.jpg`
  const uploadDir = process.env.UPLOAD_DIR ?? '/var/www/muebleuno/public/uploads'
  const filepath = join(uploadDir, filename)

  try {
    await writeFile(filepath, resized)
  } catch (err) {
    console.error('[upload] writeFile error:', err)
    return NextResponse.json({ error: 'Error al guardar el archivo' }, { status: 500 })
  }

  return NextResponse.json({ url: `/muebleuno/uploads/${filename}` })
}
