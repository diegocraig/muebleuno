import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  await createSession({ id: String(user.id), email: user.email, nombre: user.nombre, rol: user.rol })
  return NextResponse.json({ ok: true })
}
