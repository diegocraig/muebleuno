import Link from 'next/link'

export default function BannerDestacado() {
  return (
    <div className="bg-gris-oscuro text-white py-16 text-center my-4">
      <p className="text-sm uppercase tracking-widest text-rojo-suave mb-3 font-semibold">Mueble UNO</p>
      <h2 className="text-4xl md:text-5xl font-black mb-4">Diseños Únicos para tu Hogar</h2>
      <p className="text-xl opacity-80 mb-8 max-w-xl mx-auto">
        Calidad y estilo en cada mueble. Encontrá lo que buscás en nuestro catálogo completo.
      </p>
      <Link href="/productos"
        className="inline-block bg-rojo-principal hover:bg-rojo-hover text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors">
        VER TODOS LOS PRODUCTOS
      </Link>
    </div>
  )
}
