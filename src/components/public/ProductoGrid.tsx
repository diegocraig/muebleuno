import ProductoCard from './ProductoCard'

interface Producto {
  id: number; nombre: string; slug: string; precio: number; precioOferta?: number | null
  imagenes: string; novedad: boolean; enPromocion: boolean; destacado: boolean
  categoria: { nombre: string; slug: string }
}

export default function ProductoGrid({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-gris-medio">
        <p className="text-4xl mb-4">🪑</p>
        <p className="text-lg">No hay productos disponibles</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {productos.map(p => <ProductoCard key={p.id} producto={p} />)}
    </div>
  )
}
