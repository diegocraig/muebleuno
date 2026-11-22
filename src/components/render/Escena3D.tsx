'use client'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, Line, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Item, Pared } from '@/lib/render/tipos'
import { conflictos, huecos, largoPared, medidas, transformar } from '@/lib/render/escena'
import { M } from './geometria'
import { fijarAnisotropia } from './texturas'
import { useRender } from './store'
import Habitacion from './Habitacion'
import Luces from './Luces'
import Mueble3D from './Mueble3D'
import Electro3D from './Electro3D'
import Deco3D from './Deco3D'

// ─── Captura de imagen (la usa la barra de herramientas) ────────────────────

export const capturador: { fn: ((escala?: number, tipo?: 'png' | 'jpeg', calidad?: number) => string) | null } = { fn: null }

function Capturador() {
  const { gl, scene, camera, size } = useThree()
  useEffect(() => {
    fijarAnisotropia(gl.capabilities.getMaxAnisotropy())
    capturador.fn = (escala = 1, tipo = 'png', calidad = 0.9) => {
      const pr = gl.getPixelRatio()
      gl.setPixelRatio(pr * escala)
      gl.setSize(size.width, size.height, false)
      gl.render(scene, camera)
      const url = gl.domElement.toDataURL(`image/${tipo}`, calidad)
      gl.setPixelRatio(pr)
      gl.setSize(size.width, size.height, false)
      gl.render(scene, camera)
      return url
    }
    return () => { capturador.fn = null }
  }, [gl, scene, camera, size])
  return null
}

// ─── Cámara ─────────────────────────────────────────────────────────────────

function Camaras() {
  const camara = useRender(s => s.vista.camara)
  const version = useRender(s => s.camaraVersion)
  const arrastrando = useRender(s => s.arrastrando)
  const amb = useRender(s => s.escena.ambiente)
  const controles = useRef<OrbitControlsImpl>(null)
  const { size } = useThree()
  const camaraActiva = useThree(s => s.camera)
  const W = amb.ancho * M, D = amb.largo * M, H = amb.alto * M

  // Depende de la cámara activa: drei la reemplaza después del primer render.
  useEffect(() => {
    const c = controles.current
    if (!c || c.object !== camaraActiva) return
    const cam = camaraActiva
    if (camara === 'perspectiva') {
      cam.position.set(W * 0.5 + W * 0.35, H * 1.15, D + Math.max(W, D) * 0.95)
      c.target.set(W / 2, 0.9, D / 2)
    } else if (camara === 'frente') {
      cam.position.set(W / 2, 1.45, D - 0.25)
      c.target.set(W / 2, 1.2, 0)
    } else {
      cam.position.set(W / 2, 12, D / 2 + 0.001)
      c.target.set(W / 2, 0, D / 2)
      const ortho = cam as THREE.OrthographicCamera
      ortho.zoom = Math.min(size.width / (W + 1.2), size.height / (D + 1.2))
      ortho.updateProjectionMatrix()
    }
    c.update()
  }, [camara, camaraActiva, version, W, D, H, size.width, size.height])

  return (
    <>
      {camara === 'planta'
        ? <OrthographicCamera makeDefault near={0.1} far={50} position={[W / 2, 12, D / 2]} />
        : <PerspectiveCamera makeDefault fov={camara === 'frente' ? 60 : 42} near={0.05} far={80} />}
      <OrbitControls
        ref={controles}
        makeDefault
        enabled={!arrastrando}
        enableRotate={camara !== 'planta'}
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={camara === 'planta' ? 0 : Math.PI / 2 - 0.02}
        minDistance={0.3}
        maxDistance={25}
      />
    </>
  )
}

// ─── Ítems: selección y arrastre ────────────────────────────────────────────

/** Plano sobre el que se arrastra un ítem (paralelo a su pared, o el piso). */
function planoArrastre(it: Item, W: number, D: number): THREE.Plane {
  const p = (medidas(it).prof + (it.separacion ?? 0)) * M
  switch (it.ubicacion) {
    case 'fondo': return new THREE.Plane(new THREE.Vector3(0, 0, 1), -p)
    case 'frente': return new THREE.Plane(new THREE.Vector3(0, 0, -1), D - p)
    case 'izq': return new THREE.Plane(new THREE.Vector3(1, 0, 0), -p)
    case 'der': return new THREE.Plane(new THREE.Vector3(-1, 0, 0), W - p)
    default: return new THREE.Plane(new THREE.Vector3(0, 1, 0), -it.elevacion * M)
  }
}

const coordPared = (u: Pared, v: THREE.Vector3) => (u === 'fondo' || u === 'frente' ? v.x : v.z) / M

function ItemNodo({ it, seleccionado, conflicto }: { it: Item; seleccionado: boolean; conflicto: boolean }) {
  const esc = useRender(s => s.escena)
  const seleccionar = useRender(s => s.seleccionar)
  const moverItem = useRender(s => s.moverItem)
  const moverLibre = useRender(s => s.moverLibre)
  const marcarHistoria = useRender(s => s.marcarHistoria)
  const setArrastrando = useRender(s => s.setArrastrando)
  const imanes = useRender(s => s.vista.imanes)
  const W = esc.ambiente.ancho * M, D = esc.ambiente.largo * M
  const arrastre = useRef<{ plano: THREE.Plane; offset: THREE.Vector2; inicio: THREE.Vector2; movido: boolean; id: number } | null>(null)
  const { cx, cz, rot } = transformar(it, esc)
  const { ancho, alto, prof } = medidas(it)

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    seleccionar(it.id)
    if (it.bloqueado) return
    const plano = planoArrastre(it, W, D)
    const hit = new THREE.Vector3()
    if (!e.ray.intersectPlane(plano, hit)) return
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const offset = it.ubicacion === 'libre'
      ? new THREE.Vector2(hit.x / M - (it.x ?? 0), hit.z / M - (it.z ?? 0))
      : new THREE.Vector2(coordPared(it.ubicacion, hit) - it.s, 0)
    arrastre.current = { plano, offset, inicio: new THREE.Vector2(e.clientX, e.clientY), movido: false, id: e.pointerId }
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const a = arrastre.current
    if (!a) return
    if (!a.movido) {
      if (a.inicio.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) < 4) return
      a.movido = true
      marcarHistoria()
      setArrastrando(true)
    }
    const hit = new THREE.Vector3()
    if (!e.ray.intersectPlane(a.plano, hit)) return
    const sinImanes = !imanes || e.altKey
    if (it.ubicacion === 'libre') moverLibre(it.id, hit.x / M - a.offset.x, hit.z / M - a.offset.y)
    else moverItem(it.id, coordPared(it.ubicacion, hit) - a.offset.x, !sinImanes)
  }
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!arrastre.current) return
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    arrastre.current = null
    setArrastrando(false)
  }

  const borde = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(ancho * M + 0.01, alto * M + 0.01, prof * M + 0.01)), [ancho, alto, prof])
  const esq = it.modulo?.tipo.startsWith('esquinero')

  return (
    <group position={[cx * M, it.elevacion * M, cz * M]} rotation={[0, (rot * Math.PI) / 180, 0]}>
      <group onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {it.modulo ? <Mueble3D it={it} /> : it.deco ? <Deco3D it={it} /> : <Electro3D it={it} />}
      </group>
      {(seleccionado || conflicto) && !esq && (
        <lineSegments geometry={borde} position={[0, (alto * M) / 2, 0]}>
          <lineBasicMaterial color={conflicto ? '#f59e0b' : '#C0272D'} depthTest={false} transparent opacity={0.9} />
        </lineSegments>
      )}
      {(seleccionado || conflicto) && esq && (
        <mesh position={[0, (alto * M) / 2, 0]}>
          <boxGeometry args={[ancho * M + 0.01, alto * M + 0.01, prof * M + 0.01]} />
          <meshBasicMaterial color={conflicto ? '#f59e0b' : '#C0272D'} wireframe depthTest={false} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

// ─── Cotas ──────────────────────────────────────────────────────────────────

function Etiqueta({ p, texto, fuerte = false }: { p: [number, number, number]; texto: string; fuerte?: boolean }) {
  return (
    <Html position={p} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold shadow ${fuerte ? 'bg-rojo-principal text-white' : 'bg-white/90 text-gris-oscuro'}`}>{texto}</span>
    </Html>
  )
}

/** Punto 3D a una distancia `s` (cm) sobre la pared, a `dz` cm de ella y altura y (m). */
function puntoPared(p: Pared, s: number, dz: number, y: number, W: number, D: number): [number, number, number] {
  switch (p) {
    case 'fondo': return [s * M, y, dz * M]
    case 'frente': return [s * M, y, D - dz * M]
    case 'izq': return [dz * M, y, s * M]
    case 'der': return [W - dz * M, y, s * M]
  }
}

function Cotas() {
  const esc = useRender(s => s.escena)
  const sel = useRender(s => s.escena.items.find(i => i.id === s.seleccion))
  const camara = useRender(s => s.vista.camara)
  const W = esc.ambiente.ancho * M, D = esc.ambiente.largo * M
  const cm = (v: number) => `${Math.round(v * 10) / 10} cm`
  const paredes = (['fondo', 'izq', 'der', 'frente'] as Pared[]).filter(p => esc.ambiente.paredes[p])

  const detalle = (() => {
    if (!sel || sel.ubicacion === 'libre') return null
    const { ancho, alto, prof } = medidas(sel)
    const h = huecos(esc, sel)
    const y = (sel.elevacion + alto) * M + 0.08
    const dz = prof + (sel.separacion ?? 0) + 4
    const u = sel.ubicacion
    const a = puntoPared(u, sel.s, dz, y, W, D), b = puntoPared(u, sel.s + ancho, dz, y, W, D)
    const L = largoPared(esc, u)
    const lineas: { p: [number, number, number][]; t: string; m: [number, number, number]; f?: boolean }[] = [
      { p: [a, b], t: cm(ancho), m: puntoPared(u, sel.s + ancho / 2, dz, y + 0.06, W, D), f: true },
    ]
    if (h && h.izq > 0.4) {
      const c = puntoPared(u, sel.s - h.izq, dz, y, W, D)
      lineas.push({ p: [c, a], t: cm(h.izq), m: puntoPared(u, sel.s - h.izq / 2, dz, y + 0.06, W, D) })
    }
    if (h && h.der > 0.4) {
      const c = puntoPared(u, Math.min(L, sel.s + ancho + h.der), dz, y, W, D)
      lineas.push({ p: [b, c], t: cm(h.der), m: puntoPared(u, sel.s + ancho + h.der / 2, dz, y + 0.06, W, D) })
    }
    if (sel.elevacion > 1) {
      const base = puntoPared(u, sel.s + ancho / 2, dz, 0, W, D), top = puntoPared(u, sel.s + ancho / 2, dz, sel.elevacion * M, W, D)
      lineas.push({ p: [base, top], t: `↕ ${cm(sel.elevacion)}`, m: puntoPared(u, sel.s + ancho / 2, dz, (sel.elevacion * M) / 2, W, D) })
    }
    return lineas
  })()

  return (
    <group>
      {paredes.map(p => {
        const L = largoPared(esc, p)
        const y = camara === 'planta' ? 0.02 : 0.02
        const a = puntoPared(p, 0, -12, y, W, D), b = puntoPared(p, L, -12, y, W, D)
        return (
          <group key={p}>
            <Line points={[a, b]} color="#4A4A4A" lineWidth={1} />
            <Etiqueta p={puntoPared(p, L / 2, -22, y, W, D)} texto={cm(L)} />
          </group>
        )
      })}
      {detalle?.map((l, i) => (
        <group key={i}>
          <Line points={l.p} color="#C0272D" lineWidth={2} depthTest={false} />
          <Etiqueta p={l.m} texto={l.t} fuerte={l.f} />
        </group>
      ))}
    </group>
  )
}

function Mundo() {
  const items = useRender(s => s.escena.items)
  const esc = useRender(s => s.escena)
  const seleccion = useRender(s => s.seleccion)
  const cotas = useRender(s => s.vista.cotas)
  const capturando = useRender(s => s.capturando)
  const enConflicto = useMemo(() => {
    const set = new Set<string>()
    for (const c of conflictos(esc)) { set.add(c.a); if (c.b) set.add(c.b) }
    return set
  }, [esc])
  return (
    <>
      <Habitacion />
      {items.map(it => <ItemNodo key={it.id} it={it} seleccionado={!capturando && it.id === seleccion} conflicto={!capturando && enConflicto.has(it.id)} />)}
      {cotas && !capturando && <Cotas />}
    </>
  )
}

export default function Escena3D() {
  const seleccionar = useRender(s => s.seleccionar)
  const fondo = useRender(s => s.escena.luces.fondo)
  const sombras = useRender(s => s.escena.luces.sombras)
  const alta = useRender(s => s.vista.calidad === 'alta')
  return (
    <Canvas
      shadows={sombras ? 'soft' : false}
      dpr={alta ? [1, 2] : [1, 1.5]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onPointerMissed={e => { if (e.button === 0) seleccionar(null) }}
      style={{ background: fondo }}
    >
      <color attach="background" args={[fondo]} />
      <Camaras />
      <Luces />
      <Mundo />
      <Capturador />
    </Canvas>
  )
}
