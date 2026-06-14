import { NextResponse } from 'next/server'
import { hasBackupSession, listBackups } from '@/lib/backups'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await hasBackupSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const backups = await listBackups()
  return NextResponse.json({ backups })
}
