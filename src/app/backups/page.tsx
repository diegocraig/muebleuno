import { hasBackupSession } from '@/lib/backups'
import LoginForm from './LoginForm'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Backups · muebleuno', robots: { index: false, follow: false } }

export default async function BackupsPage() {
  const authed = await hasBackupSession()
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold">Backups · muebleuno.com</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Copias de seguridad automáticas de la base de datos y las imágenes.
        </p>
        {authed ? <BackupsClient /> : <LoginForm />}
      </div>
    </main>
  )
}
