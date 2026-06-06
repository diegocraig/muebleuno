'use client'
import { useState } from 'react'

interface Config {
  id: number; nombreTienda: string; telefono?: string | null; whatsapp?: string | null
  email?: string | null; direccion?: string | null; instagram?: string | null
  facebook?: string | null; textoBanner?: string | null
}

export default function ConfiguracionAdmin({ config: initial }: { config: Config | null }) {
  const [form, setForm] = useState({
    nombreTienda: initial?.nombreTienda ?? 'Mueble UNO',
    telefono: initial?.telefono ?? '',
    whatsapp: initial?.whatsapp ?? '',
    email: initial?.email ?? '',
    direccion: initial?.direccion ?? '',
    instagram: initial?.instagram ?? '',
    facebook: initial?.facebook ?? '',
    textoBanner: initial?.textoBanner ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await fetch('/muebleuno/api/configuracion', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const field = (key: keyof typeof form, label: string, placeholder = '') => (
    <div key={key}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración de la tienda</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('nombreTienda', 'Nombre de la tienda', 'Mueble UNO')}
          {field('telefono', 'Teléfono', '+54 9 379...')}
          {field('whatsapp', 'WhatsApp (solo números)', '5491126484463')}
          {field('email', 'Email', 'ventas@...')}
          {field('direccion', 'Dirección', 'El Palomar, Buenos Aires')}
          {field('instagram', 'Instagram (sin @)', 'muebleuno')}
          {field('facebook', 'Facebook', 'muebleuno')}
          <div>
            <label className="block text-sm font-medium mb-1">Texto del banner superior</label>
            <input value={form.textoBanner} onChange={e => setForm(f => ({ ...f, textoBanner: e.target.value }))}
              placeholder="Envíos a todo el país — Cuotas sin interés"
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={loading}
              className="bg-rojo-principal hover:bg-rojo-hover disabled:opacity-60 text-white font-bold px-8 py-2.5 rounded-lg">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">✓ Guardado</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
