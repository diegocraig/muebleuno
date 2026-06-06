import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) return null
        return { id: String(user.id), email: user.email, name: user.nombre, rol: user.rol }
      },
    }),
  ],
  pages: { signIn: '/admin/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.rol = (user as { rol?: string }).rol
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as { rol?: unknown }).rol = token.rol
      return session
    },
  },
})
