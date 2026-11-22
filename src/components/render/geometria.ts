import * as THREE from 'three'

// Cajas con UVs en metros: así una textura de "60 cm" mide 60 cm en cualquier
// panel, sin estirarse según el tamaño de la pieza.

const cache = new Map<string, THREE.BoxGeometry>()

export function cajaUV(w: number, h: number, d: number): THREE.BoxGeometry {
  const k = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}`
  const hit = cache.get(k)
  if (hit) return hit
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada una)
  const escalas: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let cara = 0; cara < 6; cara++) {
    const [su, sv] = escalas[cara]
    for (let v = 0; v < 4; v++) {
      const i = cara * 4 + v
      uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv)
    }
  }
  uv.needsUpdate = true
  cache.set(k, g)
  return g
}

/** cm → m */
export const M = 0.01
