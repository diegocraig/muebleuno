'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BackupFile {
  name: string
  kind: 'daily' | 'full' | 'safety'
  size: number
  createdAt: string
}

const KIND_LABEL: Record<BackupFile['kind'], string> = {
  daily: 'Diario',
  full: 'Completo',
  safety: 'Seguridad',
}
const KIND_STYLE: Record<BackupFile['kind'], string> = {
  daily: 'bg-blue-100 text-blue-700',
  full: 'bg-emerald-100 text-emerald-700',
  safety: 'bg-amber-100 text-amber-700',
}

function fmtSize(b: number) {
  if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB'
  if (b >= 1024) return (b / 1024).toFixed(0) + ' KB'
  return b + ' B'
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function BackupsClient() {
  const router = useRouter()
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<BackupFile | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/backups/list')
      if (res.status === 401) {
        router.refresh()
        return
      }
      const data = await res.json()
      setBackups(data.backups || [])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  async function createNow() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/backups/run', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg(data.error || 'Error al crear el backup.')
      else {
        setMsg('Backup creado correctamente.')
        await load()
      }
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/backups/auth', { method: 'DELETE' })
    router.refresh()
  }

  async function doRestore() {
    if (!confirmTarget) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: confirmTarget.kind, name: confirmTarget.name, confirm: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMsg(data.error || 'Error al restaurar.')
      else setMsg(data.message || 'Restauración iniciada.')
    } finally {
      setBusy(false)
      setConfirmTarget(null)
      setConfirmText('')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={createNow}
            disabled={busy}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Procesando…' : 'Crear backup ahora'}
          </button>
          <button
            onClick={load}
            disabled={loading || busy}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Actualizar
          </button>
        </div>
        <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
          Cerrar sesión
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">{msg}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Tamaño</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  No hay backups todavía.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={`${b.kind}/${b.name}`}>
                  <td className="px-4 py-3">{fmtDate(b.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KIND_STYLE[b.kind]}`}>
                      {KIND_LABEL[b.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{fmtSize(b.size)}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/backups/download?kind=${b.kind}&name=${encodeURIComponent(b.name)}`}
                      className="mr-3 text-neutral-700 hover:text-neutral-900 hover:underline"
                    >
                      Descargar
                    </a>
                    <button
                      onClick={() => {
                        setConfirmTarget(b)
                        setConfirmText('')
                      }}
                      className="text-red-600 hover:text-red-800 hover:underline"
                    >
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Backup automático cada 24&nbsp;h · se conservan los últimos 6 diarios y un backup completo
        cada 10 días · copia off-site en Google Drive.
      </p>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-red-700">Restaurar este backup</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Vas a reemplazar la base de datos y las imágenes actuales por las del backup del{' '}
              <strong>{fmtDate(confirmTarget.createdAt)}</strong>. Antes se guardará automáticamente
              un backup de seguridad del estado actual. La aplicación se reiniciará.
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Escribí <strong>RESTAURAR</strong> para confirmar:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-600"
              placeholder="RESTAURAR"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={doRestore}
                disabled={busy || confirmText !== 'RESTAURAR'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? 'Restaurando…' : 'Restaurar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
