import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Building2, ChevronRight, Phone, MessageCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import MedidaCarrusel from '@/components/public/MedidaCarrusel'

export const metadata: Metadata = {
  title: 'Muebles a Medida | Mueble UNO',
  description: 'Placards, cocinas, escritorios y soluciones de amoblamiento a medida para viviendas, edificios y proyectos de arquitectura en Buenos Aires.',
}

export const revalidate = 0

export default async function MueblesAMedidaPage() {
  const [config, servicios, pasos, materiales, fotos] = await Promise.all([
    prisma.medidaConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.medidaServicio.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.medidaPaso.findMany({ orderBy: { orden: 'asc' } }),
    prisma.medidaMaterial.findMany({ orderBy: { orden: 'asc' } }),
    prisma.medidaFoto.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
  ])

  const edificiosItems: string[] = JSON.parse(config.edificiosItems || '[]')
  const waUrl = `https://wa.me/5491173670283?text=${encodeURIComponent(config.whatsappMsg)}`

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="bg-gris-oscuro text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-rojo-principal text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            {config.heroBadge}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-5 leading-tight whitespace-pre-line">
            {config.heroTitulo}
          </h1>
          <p className="text-lg text-gris-claro max-w-2xl mx-auto mb-8">{config.heroDescripcion}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
            </a>
            <Link href="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Phone className="w-5 h-5" /> Solicitar visita
            </Link>
          </div>
        </div>
      </section>

      {/* Servicios */}
      {servicios.length > 0 && (
        <section className="py-16 px-4 bg-gris-fondo">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-2">Nuestros servicios</h2>
            <p className="text-center text-gris-medio mb-10">Soluciones completas para viviendas y proyectos de mayor escala</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicios.map(s => {
                const items: string[] = JSON.parse(s.items || '[]')
                return (
                  <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg mb-2">{s.titulo}</h3>
                    <p className="text-sm text-gris-medio mb-4 leading-relaxed">{s.descripcion}</p>
                    <ul className="space-y-1.5">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-rojo-principal shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Para edificios */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gris-oscuro text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-rojo-principal" />
                <span className="font-bold text-rojo-principal uppercase text-sm tracking-wider">Proyectos para edificios</span>
              </div>
              <h2 className="text-3xl font-black mb-4">{config.edificiosTitulo}</h2>
              <p className="text-gris-claro leading-relaxed mb-6">{config.edificiosDesc}</p>
              {edificiosItems.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {edificiosItems.map(i => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gris-claro">
                      <ChevronRight className="w-4 h-4 text-rojo-principal shrink-0" />{i}
                    </li>
                  ))}
                </ul>
              )}
              <a href={`https://wa.me/5491173670283?text=${encodeURIComponent('Hola, quiero consultar sobre muebles para edificio')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-6 py-3 rounded-xl transition-colors">
                <MessageCircle className="w-5 h-5" /> Hablar con un asesor
              </a>
            </div>
            <div className="w-full md:w-64 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-6">
              {[
                { n: config.stat1Numero, t: config.stat1Texto },
                { n: config.stat2Numero, t: config.stat2Texto },
                { n: config.stat3Numero, t: config.stat3Texto },
              ].map(s => (
                <div key={s.n}>
                  <p className="text-4xl font-black text-rojo-principal mb-1">{s.n}</p>
                  <p className="text-sm text-gris-claro">{s.t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel */}
      <MedidaCarrusel fotos={fotos} />

      {/* Proceso */}
      {pasos.length > 0 && (
        <section className="py-16 px-4 bg-gris-fondo">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-2">¿Cómo trabajamos?</h2>
            <p className="text-center text-gris-medio mb-10">Un proceso claro y transparente de principio a fin</p>
            <div className="space-y-4">
              {pasos.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-5">
                  <span className="text-3xl font-black text-rojo-principal/20 shrink-0 leading-none">{p.numero}</span>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{p.titulo}</h3>
                    <p className="text-gris-medio text-sm leading-relaxed">{p.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Materiales */}
      {materiales.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-2">Materiales que usamos</h2>
            <p className="text-center text-gris-medio mb-10">Solo trabajamos con materiales de primera calidad</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materiales.map(m => (
                <div key={m.id} className="border rounded-xl p-5 hover:border-rojo-principal transition-colors">
                  <h4 className="font-bold mb-1">{m.nombre}</h4>
                  <p className="text-sm text-gris-medio">{m.detalle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-rojo-principal text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">{config.ctaTitulo}</h2>
          <p className="mb-8 opacity-90">{config.ctaDescripcion}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-rojo-principal font-bold px-6 py-3 rounded-xl hover:bg-gris-fondo transition-colors">
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </a>
            <Link href="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Formulario de contacto
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
