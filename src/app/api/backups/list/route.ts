import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { hasBackupSession, listBackups } from '@/lib/backups'

export const dynamic = 'force-dynamic'
const execFileAsync = promisify(execFile)

async function driveConfigured(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('rclone', ['listremotes'], { timeout: 8000 })
    return /^gdrive:/m.test(stdout)
  } catch {
    return false
  }
}

export async function GET() {
  if (!(await hasBackupSession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const [backups, drive] = await Promise.all([listBackups(), driveConfigured()])
  return NextResponse.json({
    backups,
    status: {
      driveConfigured: drive,
      driveFolder: 'muebleuno-backups',
      schedule: 'Todos los días a las 03:00',
      retention: {
        daily: 6,
        fullEveryDays: 10,
        fullKeep: 6,
        safetyKeep: 10,
      },
    },
  })
}
