'use client'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Abertura, Pared } from '@/lib/render/tipos'
import { elevacionPorDefecto, topeMesada, tramosMesada, tramosSalpicadero } from '@/lib/render/escena'
import { cajaUV, M } from './geometria'
import { MAT, material, matColor } from './texturas'
import { useRender } from './store'

// Ambiente: piso, paredes con aberturas (ventanas/puertas), techo, mesadas
// continuas y salpicadero. Las paredes son planos que solo se ven desde
// adentro: desde afuera la cámara "atraviesa" la pared más cercana.

/** Posición/rotación de un plano apoyado en la pared, con u a lo largo de la pared. */
function marcoPared(p: Pared, W: number, D: number): { pos: [number, number, number]; rot: number; signo: 1 | -1 } {
  switch (p) {
    case 'fondo': return { pos: [0, 0, 0], rot: 0, signo: 1 }
    case 'izq': return { pos: [0, 0, 0], rot: Math.PI / 2, signo: -1 }
    case 'der': return { pos: [W, 0, 0], rot: -Math.PI / 2, signo: 1 }
    case 'frente': return { pos: [0, 0, D], rot: Math.PI, signo: -1 }
  }
}

function geometriaPared(largo: number, alto: number, aberturas: Abertura[], signo: 1 | -1) {
  const shape = new THREE.Shape()
  const u = (v: number) => v * signo
  shape.moveTo(u(0), 0); shape.lineTo(u(largo), 0); shape.lineTo(u(largo), alto); shape.lineTo(u(0), alto); shape.closePath()
  for (const a of aberturas) {
    const x0 = Math.max(0.01, a.s * M), x1 = Math.min(largo - 0.01, (a.s + a.ancho) * M)
    const y0 = Math.max(a.tipo === 'puerta' ? 0.001 : 0.01, a.elevacion * M), y1 = Math.min(alto - 0.01, (a.elevacion + a.alto) * M)
    if (x1 <= x0 || y1 <= y0) continue
    const hole = new THREE.Path()
    hole.moveTo(u(x0), y0); hole.lineTo(u(x0), y1); hole.lineTo(u(x1), y1); hole.lineTo(u(x1), y0); hole.closePath()
    shape.holes.push(hole)
  }
  return new THREE.ShapeGeometry(shape)
}

function AberturaMalla({ a, signo }: { a: Abertura; signo: 1 | -1 }) {
  const w = a.ancho * M, h = a.alto * M
  const x = (a.s * M + w / 2) * signo
  const y = a.elevacion * M + h / 2
  const marco = matColor('#f4f4f2', 0.4, 0.2)
  const prof = 0.12
  if (a.tipo === 'ventana') {
    return (
      <group position={[x, y, -prof / 2 + 0.02]}>
        {/* marco */}
        <mesh geometry={cajaUV(w, 0.05, prof)} material={marco} position={[0, h / 2 - 0.025, 0]} castShadow />
        <mesh geometry={cajaUV(w, 0.05, prof)} material={marco} position={[0, -h / 2 + 0.025, 0]} castShadow />
        <mesh geometry={cajaUV(0.05, h, prof)} material={marco} position={[-w / 2 + 0.025, 0, 0]} castShadow />
        <mesh geometry={cajaUV(0.05, h, prof)} material={marco} position={[w / 2 - 0.025, 0, 0]} castShadow />
        <mesh geometry={cajaUV(0.04, h - 0.1, 0.05)} material={marco} position={[0, 0, 0]} castShadow />
        <mesh geometry={cajaUV(w - 0.1, h - 0.1, 0.006)} material={MAT.vidrio} />
        {/* alféizar */}
        <mesh geometry={cajaUV(w + 0.06, 0.025, 0.18)} material={marco} position={[0, -h / 2 - 0.012, 0.06]} castShadow receiveShadow />
        {/* cielo exterior */}
        <mesh position={[0, 0.2, -1.2]}>
          <planeGeometry args={[w * 4, h * 3]} />
          <meshBasicMaterial color="#dfeaf2" toneMapped={false} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[x, y, -prof / 2 + 0.02]}>
      <mesh geometry={cajaUV(w + 0.1, 0.05, prof)} material={marco} position={[0, h / 2 + 0.025, 0]} castShadow />
      <mesh geometry={cajaUV(0.05, h, prof)} material={marco} position={[-w / 2 - 0.025, 0, 0]} castShadow />
      <mesh geometry={cajaUV(0.05, h, prof)} material={marco} position={[w / 2 + 0.025, 0, 0]} castShadow />
      <mesh geometry={cajaUV(w - 0.01, h - 0.01, 0.04)} material={matColor('#e9e5dd', 0.6)} position={[0, 0, -0.03]} castShadow receiveShadow />
      <mesh material={MAT.inox} position={[w / 2 - 0.08, -h / 2 + 1.0, 0.01]}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
      </mesh>
    </group>
  )
}

function ParedMalla({ largo, alto, aberturas, signo, mat }: { largo: number; alto: number; aberturas: Abertura[]; signo: 1 | -1; mat: THREE.Material }) {
  // La geometría solo se regenera si cambian las medidas o las aberturas, y la anterior se libera.
  const clave = `${largo}|${alto}|${signo}|${aberturas.map(a => `${a.s},${a.ancho},${a.alto},${a.elevacion},${a.tipo}`).join(';')}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => geometriaPared(largo, alto, aberturas, signo), [clave])
  useEffect(() => () => geo.dispose(), [geo])
  return <mesh geometry={geo} material={mat} receiveShadow castShadow />
}

function Paredes() {
  const { ancho, largo, alto, paredes, aberturas } = useRender(s => s.escena.ambiente)
  const def = useRender(s => s.escena.materiales.paredes)
  const W = ancho * M, D = largo * M, H = alto * M
  const mat = material(def, true)
  return (
    <>
      {(['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(p => paredes[p]).map(p => {
        const { pos, rot, signo } = marcoPared(p, W, D)
        const L = p === 'fondo' || p === 'frente' ? W : D
        const abs = aberturas.filter(a => a.pared === p)
        return (
          <group key={p} position={pos} rotation={[0, rot, 0]}>
            <ParedMalla largo={L} alto={H} aberturas={abs} signo={signo} mat={mat} />
            {abs.map(a => <AberturaMalla key={a.id} a={a} signo={signo} />)}
          </group>
        )
      })}
    </>
  )
}

function Piso() {
  const ancho = useRender(s => s.escena.ambiente.ancho)
  const largo = useRender(s => s.escena.ambiente.largo)
  const def = useRender(s => s.escena.materiales.piso)
  const fondo = useRender(s => s.escena.luces.fondo)
  const W = ancho * M, D = largo * M
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, D)
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * D)
    return g
  }, [W, D])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <group>
      <mesh geometry={geo} material={material(def)} rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, D / 2]} receiveShadow />
      {/* base gris fuera del ambiente */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, -0.005, D / 2]} receiveShadow>
        <planeGeometry args={[W + 30, D + 30]} />
        <meshStandardMaterial color={fondo} roughness={1} />
      </mesh>
    </group>
  )
}

function Techo() {
  const ancho = useRender(s => s.escena.ambiente.ancho)
  const largo = useRender(s => s.escena.ambiente.largo)
  const alto = useRender(s => s.escena.ambiente.alto)
  const def = useRender(s => s.escena.materiales.techo)
  const W = ancho * M, D = largo * M, H = alto * M
  // Mira hacia abajo: desde arriba no se ve, pero igual proyecta sombra.
  return <mesh material={material(def, true)} rotation={[Math.PI / 2, 0, 0]} position={[W / 2, H, D / 2]} castShadow receiveShadow><planeGeometry args={[W, D]} /></mesh>
}

function Mesadas() {
  const esc = useRender(s => s.escena)
  const est = esc.estandares
  const W = esc.ambiente.ancho, D = esc.ambiente.largo
  const matMesada = material(esc.materiales.mesada)
  const matSalp = material(esc.materiales.salpicadero)
  const esp = est.espesorMesada * M
  const pm = est.profMesada
  const y = est.alturaBajo * M + esp / 2
  const tope = topeMesada(est)
  const altoSalp = Math.max(10, elevacionPorDefecto({ tipo: 'alacena', ancho: 60, alto: 60, profundidad: 30, columnas: [] }, null, est) - tope)
  const orden: Record<string, number> = { fondo: 0, izq: 1, der: 2, frente: 3 }
  return (
    <>
      {tramosMesada(esc).filter(t => !t.caja).map((t, i) => {
        const L = t.s1 - t.s0
        const mid = (t.s0 + t.s1) / 2
        let cx = 0, cz = 0, rot = 0
        switch (t.ubicacion) {
          case 'fondo': cx = mid; cz = pm / 2; rot = 0; break
          case 'frente': cx = mid; cz = D - pm / 2; rot = Math.PI; break
          case 'izq': cx = pm / 2; cz = mid; rot = Math.PI / 2; break
          case 'der': cx = W - pm / 2; cz = mid; rot = -Math.PI / 2; break
        }
        const dy = orden[t.ubicacion] * 0.0004 // evita parpadeo donde se cruzan dos tramos en una esquina
        return (
          <group key={i} position={[cx * M, 0, cz * M]} rotation={[0, rot, 0]}>
            <mesh geometry={cajaUV(L * M, esp, pm * M)} material={matMesada} position={[0, y + dy, 0]} castShadow receiveShadow />
            {est.salpicadero && tramosSalpicadero(esc, t, tope, tope + altoSalp).map(([a, b], k) => (
              <mesh
                key={k}
                geometry={cajaUV((b - a) * M, altoSalp * M, 0.008)}
                material={matSalp}
                // En paredes izquierda y frente el eje local corre al revés que `s`.
                position={[((a + b) / 2 - mid) * M * (t.ubicacion === 'izq' || t.ubicacion === 'frente' ? -1 : 1), tope * M + (altoSalp * M) / 2, -pm * M / 2 + 0.004 + dy]}
                receiveShadow
              />
            ))}
          </group>
        )
      })}
    </>
  )
}

export default function Habitacion() {
  return (
    <group>
      <Piso />
      <Paredes />
      <Techo />
      <Mesadas />
    </group>
  )
}
