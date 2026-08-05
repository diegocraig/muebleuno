'use client'
import { useEffect } from 'react'
import { trackPixel, MONEDA } from '@/lib/pixel'

interface Props {
  contentId: string
  nombre: string
  categoria: string
  valor: number
}

// ViewContent en la ficha de producto. El content_id es el mismo g:id del feed,
// que es lo que permite el retargeting dinámico (mostrar en el anuncio el
// producto exacto que la persona miró).
export default function PixelViewContent({ contentId, nombre, categoria, valor }: Props) {
  useEffect(() => {
    trackPixel('ViewContent', {
      content_type: 'product',
      content_ids: [contentId],
      content_name: nombre,
      content_category: categoria,
      value: valor,
      currency: MONEDA,
    })
  }, [contentId, nombre, categoria, valor])

  return null
}
