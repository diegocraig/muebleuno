import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { hasBackupSession, resolveBackupPath, APP_DIR } from '@/lib/backups'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await hasBackupSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { kind?: string; name?: string; confirm?: boolean } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  if (body.confirm !== true) {
    return NextResponse.json({ error: 'Falta confirmación.' }, { status: 400 })
  }

  const filePath = resolveBackupPath(body.kind || '', body.name || '')
  if (!filePath) {
    return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 })
  }
  try {
    await fs.access(filePath)
  } catch {
    return NextResponse.json({ error: 'No encontrado.' }, { status: 404 })
  }

  // La restauración reinicia la app que atiende esta petición, así que la
  // lanzamos desprendida y respondemos de inmediato.
  const script = path.join(APP_DIR, 'scripts', 'restore.sh')
  const child = spawn('/bin/bash', [script, filePath], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()

  return NextResponse.json({
    ok: true,
    message: 'Restauración iniciada. La aplicación se reiniciará en unos segundos.',
  })
}
