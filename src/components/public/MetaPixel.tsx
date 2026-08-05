import MetaPixelScript from './MetaPixelScript'

// Server component: lee el ID en cada request. A propósito NO usa NEXT_PUBLIC_*,
// porque Next congela esas variables en tiempo de build y habría que rebuildear
// cada vez que marketing cambie el Pixel. Así alcanza con `pm2 restart`.
// Si META_PIXEL_ID no está seteado no se renderiza nada.
export default function MetaPixel() {
  const pixelId = process.env.META_PIXEL_ID?.trim()
  if (!pixelId || !/^\d+$/.test(pixelId)) return null
  return <MetaPixelScript pixelId={pixelId} />
}
