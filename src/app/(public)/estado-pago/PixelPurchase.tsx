'use client'
import { useEffect } from 'react'
import { trackPixel, MONEDA } from '@/lib/pixel'

interface Props {
  pedidoId: number
  total: number
  contentIds: string[]
  cantidad: number
}

// Purchase, solo cuando el pago quedó confirmado. El eventID fijo por pedido hace
// que Meta deduplique si la persona refresca la página o vuelve al link.
export default function PixelPurchase({ pedidoId, total, contentIds, cantidad }: Props) {
  useEffect(() => {
    trackPixel(
      'Purchase',
      {
        content_type: 'product',
        content_ids: contentIds,
        num_items: cantidad,
        value: total,
        currency: MONEDA,
      },
      { eventID: `pedido-${pedidoId}` },
    )
  }, [pedidoId, total, contentIds, cantidad])

  return null
}
