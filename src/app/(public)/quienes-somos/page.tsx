import { Factory, Wrench, Cpu, Truck, Banknote, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuienesSomosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      {/* Hero */}
      <div className="bg-gris-oscuro text-white rounded-2xl px-8 py-12 mb-12 text-center">
        <div className="flex justify-center mb-4">
          <Factory className="w-16 h-16 text-rojo-principal" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">Somos Fábrica</h1>
        <p className="text-xl opacity-85 max-w-2xl mx-auto leading-relaxed">
          Diseñamos, producimos y vendemos nuestros propios muebles. Sin intermediarios,
          con talleres propios y maquinaria de última tecnología.
        </p>
      </div>

      {/* Diferenciales de fábrica */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-rojo-suave border border-rojo-principal/20 rounded-xl p-6 text-center">
          <Wrench className="w-10 h-10 text-rojo-principal mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Talleres Propios</h3>
          <p className="text-gris-medio text-sm leading-relaxed">
            Producción 100% propia. Controlamos cada etapa del proceso para garantizar calidad y acabado perfecto.
          </p>
        </div>
        <div className="bg-rojo-suave border border-rojo-principal/20 rounded-xl p-6 text-center">
          <Cpu className="w-10 h-10 text-rojo-principal mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Tecnología de Punta</h3>
          <p className="text-gris-medio text-sm leading-relaxed">
            Maquinaria CNC de última generación para cortes de precisión, enchapados y terminaciones de nivel industrial.
          </p>
        </div>
        <div className="bg-rojo-suave border border-rojo-principal/20 rounded-xl p-6 text-center">
          <Factory className="w-10 h-10 text-rojo-principal mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Precio de Fábrica</h3>
          <p className="text-gris-medio text-sm leading-relaxed">
            Al fabricar nosotros mismos, eliminamos intermediarios y te ofrecemos precios directos sin margen adicional.
          </p>
        </div>
      </div>

      {/* Descripción */}
      <div className="prose prose-lg max-w-none mb-12">
        <p className="text-lg text-gris-medio leading-relaxed mb-4">
          <strong className="text-gris-oscuro">Mueble UNO</strong> es una fábrica de muebles ubicada en
          El Palomar, Buenos Aires. Contamos con años de experiencia en el rubro del mobiliario para
          el hogar y la oficina, con producción enteramente nacional.
        </p>
        <p className="text-gris-medio leading-relaxed mb-4">
          Nuestros talleres operan con maquinaria de última tecnología: centros de mecanizado CNC,
          equipos de enchapado de alta presión y sistemas de corte de precisión milimétrica. Esto
          nos permite ofrecer muebles con terminaciones de nivel premium a precios de fábrica.
        </p>
        <p className="text-gris-medio leading-relaxed">
          Desde el diseño hasta la entrega, cada mueble pasa por nuestro control de calidad interno.
          Nuestro equipo de asesores está disponible para ayudarte a encontrar o diseñar la solución
          ideal para tu espacio.
        </p>
      </div>

      {/* Beneficios */}
      <div className="bg-gris-fondo rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Por qué elegirnos</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Factory, text: 'Fábrica propia — precio directo sin intermediarios' },
            { icon: Cpu, text: 'Maquinaria CNC de última tecnología' },
            { icon: Truck, text: 'Envíos a todo el país' },
            { icon: Banknote, text: 'Descuento especial pagando en efectivo' },
            { icon: CreditCard, text: 'Cuotas sin interés' },
            { icon: ShieldCheck, text: 'Garantía en todos los productos' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm">
              <Icon className="w-5 h-5 text-rojo-principal shrink-0" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gris-medio mb-5">¿Querés ver nuestros productos o hacer una consulta?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/productos"
            className="inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Ver Catálogo
          </Link>
          <a href="https://wa.me/5491126484463?text=Hola, quiero consultar sobre sus productos"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            <MessageCircle className="w-5 h-5" /> Consultanos
          </a>
        </div>
      </div>

    </div>
  )
}
