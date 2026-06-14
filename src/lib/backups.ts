import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { promises as fs } from 'fs'
import path from 'path'

export const BACKUP_ROOT = process.env.BACKUP_DIR || '/var/backups/muebleuno'
export const APP_DIR = '/var/www/muebleuno'
export const BACKUP_SCRIPT = path.join(APP_DIR, 'scripts', 'backup.sh')

const COOKIE = 'mu_backups'
// Solo se permiten nombres con este patrón exacto (anti path-traversal).
export const FILE_RE = /^muebleuno-\d{8}-\d{6}\.tar\.gz$/

export type BackupKind = 'daily' | 'full' | 'safety'

export interface BackupFile {
  name: string
  kind: BackupKind
  size: number
  createdAt: string // ISO
}

function getSecret() {
  const s = process.env.BACKUPS_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('BACKUPS_SECRET no está definido')
  return new TextEncoder().encode(s)
}

// ---- Sesión dedicada para /backups ----------------------------------------
export async function createBackupSession() {
  const token = await new SignJWT({ scope: 'backups' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(getSecret())
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function hasBackupSession(): Promise<boolean> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE)?.value
    if (!token) return false
    const { payload } = await jwtVerify(token, getSecret())
    return payload.scope === 'backups'
  } catch {
    return false
  }
}

export async function destroyBackupSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

// ---- Listado de backups ----------------------------------------------------
const DIRS: Record<BackupKind, string> = {
  daily: path.join(BACKUP_ROOT, 'daily'),
  full: path.join(BACKUP_ROOT, 'full'),
  safety: path.join(BACKUP_ROOT, 'safety'),
}

async function listDir(kind: BackupKind): Promise<BackupFile[]> {
  try {
    const dir = DIRS[kind]
    const names = await fs.readdir(dir)
    const out: BackupFile[] = []
    for (const name of names) {
      if (!FILE_RE.test(name)) continue
      const st = await fs.stat(path.join(dir, name))
      out.push({ name, kind, size: st.size, createdAt: st.mtime.toISOString() })
    }
    return out
  } catch {
    return []
  }
}

export async function listBackups(): Promise<BackupFile[]> {
  const all = (await Promise.all((['full', 'daily', 'safety'] as BackupKind[]).map(listDir))).flat()
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Resuelve y valida la ruta absoluta de un backup, evitando path traversal.
export function resolveBackupPath(kind: string, name: string): string | null {
  if (!FILE_RE.test(name)) return null
  if (kind !== 'daily' && kind !== 'full' && kind !== 'safety') return null
  return path.join(DIRS[kind as BackupKind], name)
}
