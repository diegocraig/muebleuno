'use client'
import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { kelvinAHex } from '@/lib/render/materiales'
import { medidas, nivel } from '@/lib/render/escena'
import { M } from './geometria'
import { useRender } from './store'

let rectInit = false

/** Reflejos de ambiente generados localmente (sin descargar HDRs). */
function Entorno({ intensidad }: { intensidad: number }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => { scene.environment = null; env.dispose(); pmrem.dispose() }
  }, [gl, scene])
  useEffect(() => { scene.environmentIntensity = intensidad }, [scene, intensidad])
  return null
}

function Sol() {
  const sol = useRender(s => s.escena.luces.sol)
  const sombras = useRender(s => s.escena.luces.sombras)
  const alta = useRender(s => s.vista.calidad === 'alta')
  const amb = useRender(s => s.escena.ambiente)
  const luz = useRef<THREE.DirectionalLight>(null)
  const W = amb.ancho * M, D = amb.largo * M
  const centro = useMemo(() => new THREE.Vector3(W / 2, 0.8, D / 2), [W, D])
  const az = (sol.azimut * Math.PI) / 180, el = (sol.elevacion * Math.PI) / 180
  const dist = 9
  const pos: [number, number, number] = [
    centro.x + Math.cos(el) * Math.sin(az) * dist,
    centro.y + Math.sin(el) * dist,
    centro.z - Math.cos(el) * Math.cos(az) * dist,
  ]
  useEffect(() => {
    if (!luz.current) return
    luz.current.target.position.copy(centro)
    luz.current.target.updateMatrixWorld()
  }, [centro])
  if (!sol.activo) return null
  const r = Math.max(W, D) * 0.9
  return (
    <directionalLight
      ref={luz}
      position={pos}
      intensity={sol.intensidad}
      color={kelvinAHex(sol.temperatura)}
      castShadow={sombras}
      shadow-mapSize={alta ? [4096, 4096] : [2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-camera-left={-r}
      shadow-camera-right={r}
      shadow-camera-top={r}
      shadow-camera-bottom={-r}
      shadow-camera-near={1}
      shadow-camera-far={25}
    />
  )
}

function SpotTecho({ x, z, H, intensidad, color, sombra }: { x: number; z: number; H: number; intensidad: number; color: string; sombra: boolean }) {
  const objetivo = useMemo(() => new THREE.Object3D(), [])
  return (
    <group position={[x, H - 0.01, z]}>
      <primitive object={objetivo} position={[0, -2, 0]} />
      <spotLight
        target={objetivo}
        intensity={intensidad}
        color={color}
        angle={1.0}
        penumbra={0.75}
        distance={0}
        decay={2}
        castShadow={sombra}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        position={[0, -0.02, 0]}
      />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function LucesTecho() {
  const techo = useRender(s => s.escena.luces.techo)
  const amb = useRender(s => s.escena.ambiente)
  const sombras = useRender(s => s.escena.luces.sombras)
  const W = amb.ancho * M, D = amb.largo * M, H = amb.alto * M
  const color = kelvinAHex(techo.temperatura)
  if (!techo.activo) return null
  const puntos: [number, number][] = []
  for (let i = 0; i < techo.filas; i++) for (let j = 0; j < techo.columnas; j++) {
    puntos.push([(W * (j + 0.5)) / techo.columnas, (D * (i + 0.5)) / techo.filas])
  }
  return (
    <>
      {puntos.map(([x, z], k) => techo.tipo === 'spot' ? (
        <SpotTecho key={k} x={x} z={z} H={H} intensidad={techo.intensidad * 3.5} color={color} sombra={false} />
      ) : (
        <group key={k} position={[x, H - 0.012, z]}>
          <rectAreaLight width={0.6} height={0.6} intensity={techo.intensidad * 1.6} color={color} rotation={[-Math.PI / 2, 0, 0]} />
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** Tira LED bajo cada alacena (luz de área + tira emisiva). */
function LedsAlacena() {
  const led = useRender(s => s.escena.luces.led)
  const items = useRender(s => s.escena.items)
  const amb = useRender(s => s.escena.ambiente)
  if (!led.activo) return null
  const W = amb.ancho, D = amb.largo
  const color = kelvinAHex(led.temperatura)
  return (
    <>
      {items.filter(it => it.modulo && nivel(it) === 'alto' && it.ubicacion !== 'libre').slice(0, 16).map(it => {
        const { ancho, prof } = medidas(it)
        const s = it.s + ancho / 2
        const dz = prof - 6
        let x = 0, z = 0, rot = 0
        switch (it.ubicacion) {
          case 'fondo': x = s; z = dz; rot = 0; break
          case 'frente': x = s; z = D - dz; rot = Math.PI; break
          case 'izq': x = dz; z = s; rot = Math.PI / 2; break
          case 'der': x = W - dz; z = s; rot = -Math.PI / 2; break
        }
        const w = (ancho - 4) * M
        return (
          <group key={it.id} position={[x * M, it.elevacion * M - 0.004, z * M]} rotation={[0, rot, 0]}>
            <rectAreaLight width={w} height={0.04} intensity={led.intensidad * 6} color={color} rotation={[-Math.PI / 2, 0, 0]} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, 0.012]} />
              <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

export default function Luces() {
  const luces = useRender(s => s.escena.luces)
  const { gl } = useThree()
  if (!rectInit) { RectAreaLightUniformsLib.init(); rectInit = true }
  useEffect(() => { gl.toneMappingExposure = luces.exposicion }, [gl, luces.exposicion])
  return (
    <>
      <Entorno intensidad={luces.entorno} />
      <hemisphereLight args={['#ffffff', '#b8a999', luces.ambiente]} />
      <Sol />
      <LucesTecho />
      <LedsAlacena />
    </>
  )
}
