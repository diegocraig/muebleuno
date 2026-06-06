'use client'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5491173670283?text=Hola, quiero consultar sobre sus productos"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
      title="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6 shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap">Consulta por WhatsApp</span>
    </a>
  )
}
