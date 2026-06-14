import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { hasBackupSession, BACKUP_SCRIPT } from '@/lib/backups'

export const dynamic = 'force-dynamic'
const execFileAsync = promisify(execFile)

export async function POST() {
  if (!(await hasBackupSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    await execFileAsync('/bin/bash', [BACKUP_SCRIPT, 'manual'], { timeout: 180_000 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Fallo al crear el backup: ${msg}` }, { status: 500 })
  }
}
