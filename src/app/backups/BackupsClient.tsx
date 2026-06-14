'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BackupFile {
  name: string
  kind: 'daily' | 'full' | 'safety'
  size: number
  createdAt: string
}

interface Status {
  driveConfigured: boolean
  driveFolder: string
  schedule: string
  retention: { daily: number; fullEveryDays: number; fullKeep: number; safetyKeep: number }
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
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [showInfo, setShowInfo] = useState(false)
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
      setStatus(data.status || null)
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

  const lastBackup = backups.find((b) => b.kind !== 'safety') || backups[0]

  return (
    <div>
      {/* Estado del sistema */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Backup automático</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Activo · {status?.schedule || 'cada 24 h'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Copia en Google Drive</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium">
            <span
              className={`inline-block h-2 w-2 rounded-full ${status?.driveConfigured ? 'bg-emerald-500' : 'bg-neutral-300'}`}
            />
            {status?.driveConfigured ? 'Conectada' : 'No conectada'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Último backup</p>
          <p className="mt-1 text-sm font-medium">
            {lastBackup ? fmtDate(lastBackup.createdAt) : '—'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium"
          >
            {showInfo ? 'Ocultar guía' : 'ℹ️ Información y guía'}
          </button>
        </div>
        <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
          Cerrar sesión
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">{msg}</div>
      )}

      {showInfo && <InfoPanel status={status} />}

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

function InfoPanel({ status }: { status: Status | null }) {
  const r = status?.retention
  return (
    <div className="mb-6 space-y-6 rounded-xl border border-neutral-200 bg-white p-6 text-sm leading-relaxed shadow-sm">
      <section>
        <h2 className="mb-2 text-base font-semibold">¿Qué se respalda?</h2>
        <p className="text-neutral-600">
          Cada backup es una copia completa de la tienda: la <strong>base de datos</strong> (productos,
          categorías, pedidos, reseñas, configuración) y <strong>todas las imágenes</strong> subidas
          (catálogo, slider, etc.). Todo queda comprimido en un único archivo <code>.tar.gz</code>.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">¿Cada cuánto y cuántos se guardan?</h2>
        <ul className="list-disc space-y-1 pl-5 text-neutral-600">
          <li>Se crea un backup <strong>automático todos los días a las 03:00</strong>.</li>
          <li>Se conservan los <strong>últimos {r?.daily ?? 6} backups diarios</strong> (los más viejos se borran solos).</li>
          <li>
            Cada <strong>{r?.fullEveryDays ?? 10} días</strong> uno se guarda como{' '}
            <strong>“Completo”</strong> y se conserva por más tiempo (últimos {r?.fullKeep ?? 6}).
          </li>
          <li>
            Antes de cada restauración se crea un backup de <strong>“Seguridad”</strong> del estado
            actual (se conservan los últimos {r?.safetyKeep ?? 10}).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">¿Dónde se guardan? (doble copia)</h2>
        <ul className="list-disc space-y-1 pl-5 text-neutral-600">
          <li>
            <strong>En el servidor</strong>, en una carpeta protegida fuera de la web.
          </li>
          <li>
            <strong>En Google Drive</strong>{' '}
            {status?.driveConfigured ? (
              <>
                (conectado ✓), en la carpeta <code>{status.driveFolder}</code> con subcarpetas{' '}
                <code>daily</code> y <code>full</code>. Cada backup diario se sube automáticamente.
              </>
            ) : (
              <>(actualmente no conectado).</>
            )}
          </li>
        </ul>
        <p className="mt-2 text-neutral-600">
          Así, aunque falle el disco del servidor, las copias siguen a salvo en la nube.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Tipos de backup</h2>
        <ul className="space-y-1 text-neutral-600">
          <li>
            <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${KIND_STYLE.daily}`}>Diario</span>
            copia de cada día.
          </li>
          <li>
            <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${KIND_STYLE.full}`}>Completo</span>
            hito que se guarda cada {r?.fullEveryDays ?? 10} días por más tiempo.
          </li>
          <li>
            <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${KIND_STYLE.safety}`}>Seguridad</span>
            copia del estado anterior a una restauración (tu “deshacer”).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Cómo recuperar un backup (desde esta página)</h2>
        <ol className="list-decimal space-y-1 pl-5 text-neutral-600">
          <li>En la tabla de abajo, ubicá el backup por su <strong>fecha</strong>.</li>
          <li>
            Hacé clic en <strong className="text-red-600">Restaurar</strong> en esa fila.
          </li>
          <li>
            Leé el aviso y escribí <strong>RESTAURAR</strong> para confirmar.
          </li>
          <li>
            El sistema guarda primero un backup de <strong>Seguridad</strong> del estado actual, luego
            reemplaza la base de datos y las imágenes, y <strong>reinicia la web sola</strong> (unos
            segundos).
          </li>
          <li>Listo: la tienda queda exactamente como estaba en la fecha de ese backup.</li>
        </ol>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
          ⚠️ Restaurar reemplaza los datos actuales por los del backup elegido. Si te arrepentís,
          podés volver atrás restaurando el backup de <strong>Seguridad</strong> que se creó
          automáticamente justo antes.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Descargar una copia</h2>
        <p className="text-neutral-600">
          El botón <strong>Descargar</strong> baja el archivo <code>.tar.gz</code> a tu computadora.
          Sirve para guardar una copia propia. Adentro encontrás <code>db/muebleuno.db</code> (la base
          de datos), la carpeta <code>uploads/</code> (imágenes) y <code>manifest.json</code> (datos
          del backup).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Recuperación de emergencia (desde Google Drive)</h2>
        <p className="text-neutral-600">
          Si el servidor se perdiera por completo, los backups siguen en tu Google Drive (carpeta{' '}
          <code>{status?.driveFolder || 'muebleuno-backups'}</code>). Para restaurar en un servidor
          nuevo, alguien con acceso técnico (SSH) debe:
        </p>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-neutral-600">
          <li>Descargar el <code>.tar.gz</code> deseado desde Google Drive.</li>
          <li>
            Colocarlo en <code>/var/backups/muebleuno/daily/</code> del servidor.
          </li>
          <li>
            Ejecutar: <code>bash /var/www/muebleuno/scripts/restore.sh /var/backups/muebleuno/daily/NOMBRE.tar.gz</code>
          </li>
        </ol>
        <p className="mt-2 text-neutral-600">
          Ese mismo script crea un backup de seguridad, restaura la base de datos y las imágenes, y
          reinicia la aplicación.
        </p>
      </section>
    </div>
  )
}
