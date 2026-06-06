'use client'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Layers, FolderTree, ShoppingBag, Image, Settings, LogOut } from 'lucide-react'


const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Layers },
  { href: '/admin/subcategorias', label: 'Subcategorías', icon: FolderTree },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/slider', label: 'Slider', icon: Image },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminSidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 bg-gris-oscuro text-white flex flex-col min-h-screen shrink-0">
      <div className="px-6 py-5 border-b border-white/10">
        <NextImage src="/muebleuno/logo.png" alt="Mueble UNO" width={130} height={28} className="h-7 w-auto brightness-0 invert mb-1" />
        <p className="text-xs text-gris-claro mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-rojo-principal text-white' : 'text-gris-claro hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={async () => { await fetch('/muebleuno/api/auth/logout', { method: 'POST' }); window.location.href = '/muebleuno/admin/login' }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gris-claro hover:bg-white/10 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
