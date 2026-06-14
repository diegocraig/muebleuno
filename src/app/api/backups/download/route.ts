import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { promises as fs } from 'fs'
import { Readable } from 'stream'
import { hasBackupSession, resolveBackupPath } from '@/lib/backups'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await hasBackupSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind') || ''
  const name = searchParams.get('name') || ''

  const filePath = resolveBackupPath(kind, name)
  if (!filePath) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }

  let size = 0
  try {
    size = (await fs.stat(filePath)).size
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const nodeStream = createReadStream(filePath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Length': String(size),
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  })
}
