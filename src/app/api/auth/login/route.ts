import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimiter'

// 5 intentos cada 15 minutos por IP
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const limit = checkRateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfter) },
      },
    )
  }

  const { email, password } = await req.json()

  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  await createSession({ id: String(user.id), email: user.email, nombre: user.nombre, rol: user.rol })
  return NextResponse.json({ ok: true })
}
