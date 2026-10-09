import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createBackupSession, destroyBackupSession, getAdminSession } from '@/lib/backups'
import { checkRateLimit } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Iniciá sesión como administrador.' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const rl = checkRateLimit(`backups-login:${ip}`, 8, 5 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Reintenta en ${rl.retryAfter}s.` },
      { status: 429 },
    )
  }

  const hash = process.env.BACKUPS_PASSWORD_HASH
  if (!hash) {
    return NextResponse.json({ error: 'Backups no configurado en el servidor.' }, { status: 500 })
  }

  let password = ''
  try {
    password = (await req.json()).password ?? ''
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  if (typeof password !== 'string' || !bcrypt.compareSync(password, hash)) {
    return NextResponse.json({ error: 'Clave incorrecta.' }, { status: 401 })
  }

  await createBackupSession(admin.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await destroyBackupSession()
  return NextResponse.json({ ok: true })
}
