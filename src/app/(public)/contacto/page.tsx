'use client'
import { useState } from 'react'
import { MapPin, Phone, MessageCircle, Clock } from 'lucide-react'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const texto = `Hola Facundo! Te escribo desde el sitio web de Mueble UNO.\n\n` +
      `Nombre: ${form.nombre}\n` +
      (form.email ? `Email: ${form.email}\n` : '') +
      (form.telefono ? `Teléfono: ${form.telefono}\n` : '') +
      `\nMensaje: ${form.mensaje}`
    window.open(`https://wa.me/5491173670283?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-rojo-principal">Contacto</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Información de Contacto</h2>
          <div className="space-y-5">

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rojo-principal mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Dirección</p>
                <a
                  href="https://maps.app.goo.gl/Qd5kPuSHchmWTmFi9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gris-medio hover:text-rojo-principal transition-colors"
                >
                  Doidamia Palacios 1468, El Palomar, Buenos Aires.
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-rojo-principal mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Teléfono</p>
                <a href="tel:01144606272" className="text-gris-medio hover:text-rojo-principal transition-colors">
                  (011) 4460-6272
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-rojo-principal mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">WhatsApp</p>
                <p className="text-xs text-gris-claro mb-2">Solo habilitados para mensajes</p>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/5491126484463?text=Hola, quiero consultar sobre sus productos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gris-medio hover:text-green-600 transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    Irupé: 11 2648-4463
                  </a>
                  <a
                    href="https://wa.me/5491173670283?text=Hola, quiero consultar sobre sus productos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gris-medio hover:text-green-600 transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    Facundo: 11 7367-0283
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-rojo-principal mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">Horario de Atención</p>
                <p className="text-gris-medio">Lunes a Jueves: 8:00 a 12:00 hs / 14:00 a 17:00 hs</p>
                <p className="text-gris-medio">Viernes: 8:00 a 12:00 hs / 14:00 a 18:00 hs</p>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a
              href="https://wa.me/5491126484463?text=Hola, quiero consultar sobre sus productos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Irupé
            </a>
            <a
              href="https://wa.me/5491173670283?text=Hola, quiero consultar sobre sus productos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Facundo
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Envianos un Mensaje</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rojo-principal"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rojo-principal"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rojo-principal"
                placeholder="(011) ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mensaje *</label>
              <textarea
                required
                rows={4}
                value={form.mensaje}
                onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rojo-principal resize-none"
                placeholder="¿En qué te podemos ayudar?"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
          </form>

          <div className="mt-8 rounded-xl overflow-hidden border">
            <iframe
              src="https://maps.google.com/maps?q=Doidamia+Palacios+1468,+El+Palomar,+Buenos+Aires&output=embed"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
