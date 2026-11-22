'use client'
import * as THREE from 'three'
import type { Item } from '@/lib/render/tipos'
import { cajaUV, M } from './geometria'
import { MAT, matAcabado } from './texturas'
import { useRender } from './store'

// Electrodomésticos simplificados pero reconocibles. Origen: centro de la
// planta a la altura de la base; frente hacia +z. Medidas en metros.

function Caja({ w, h, d, p, mat, sombra = true }: { w: number; h: number; d: number; p: [number, number, number]; mat: THREE.Material; sombra?: boolean }) {
  return <mesh geometry={cajaUV(w, h, d)} material={mat} position={p} castShadow={sombra} receiveShadow />
}

function Hornalla({ x, z, r, y }: { x: number; z: number; r: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={MAT.hierro} castShadow>
        <cylinderGeometry args={[r, r, 0.012, 20]} />
      </mesh>
      <mesh material={MAT.negro} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[r * 0.45, r * 0.5, 0.012, 16]} />
      </mesh>
      {[0, 1, 2, 3].map(k => (
        <mesh key={k} material={MAT.hierro} position={[0, 0.02, 0]} rotation={[0, (k * Math.PI) / 4, 0]}>
          <boxGeometry args={[r * 2.3, 0.008, 0.01]} />
        </mesh>
      ))}
    </group>
  )
}

function Perillas({ w, y, z, n }: { w: number; y: number; z: number; n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} material={MAT.negro} position={[-w / 2 + (w / (n + 1)) * (i + 1), y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.02, 0.025, 16]} />
        </mesh>
      ))}
    </>
  )
}

function Barra({ w, y, z, vertical = false, largo }: { w?: number; y: number; z: number; vertical?: boolean; largo: number }) {
  return (
    <mesh material={MAT.inox} position={[w ?? 0, y, z]} castShadow>
      <boxGeometry args={vertical ? [0.02, largo, 0.025] : [largo, 0.02, 0.025]} />
    </mesh>
  )
}

function quemadores(w: number, d: number) {
  const n = w > 0.7 ? 5 : 4
  const pos: [number, number, number][] = n === 5
    ? [[-w * 0.3, -d * 0.2, 0.04], [-w * 0.3, d * 0.2, 0.035], [0, 0, 0.05], [w * 0.3, -d * 0.2, 0.035], [w * 0.3, d * 0.2, 0.04]]
    : [[-w * 0.22, -d * 0.2, 0.04], [-w * 0.22, d * 0.2, 0.035], [w * 0.22, -d * 0.2, 0.035], [w * 0.22, d * 0.2, 0.045]]
  return pos
}

export default function Electro3D({ it }: { it: Item }) {
  const e = it.electro!
  const est = useRender(s => s.escena.estandares)
  const w = e.ancho * M, h = e.alto * M, d = e.profundidad * M
  const cuerpo = matAcabado(e.acabado)

  switch (e.tipo) {
    case 'heladera': {
      const freezer = h > 1.6 ? 0.32 : 0.28
      const yCorte = h * (1 - freezer)
      return (
        <group>
          <Caja w={w} h={h - 0.01} d={d - 0.03} p={[0, h / 2, -0.015]} mat={cuerpo} />
          <Caja w={w - 0.006} h={h - yCorte - 0.008} d={0.035} p={[0, (h + yCorte) / 2, d / 2 - 0.0175]} mat={cuerpo} />
          <Caja w={w - 0.006} h={yCorte - 0.03} d={0.035} p={[0, yCorte / 2 + 0.01, d / 2 - 0.0175]} mat={cuerpo} />
          <Barra w={-w / 2 + 0.05} y={yCorte + 0.18} z={d / 2 + 0.02} vertical largo={0.25} />
          <Barra w={-w / 2 + 0.05} y={yCorte - 0.35} z={d / 2 + 0.02} vertical largo={0.4} />
          <Caja w={w - 0.02} h={0.06} d={0.02} p={[0, 0.03, d / 2 - 0.05]} mat={MAT.negro} sombra={false} />
        </group>
      )
    }
    case 'cocina': {
      const top = h - 0.02
      return (
        <group>
          <Caja w={w} h={top} d={d - 0.02} p={[0, top / 2, -0.01]} mat={cuerpo} />
          <Caja w={w} h={0.02} d={d} p={[0, top + 0.01, 0]} mat={MAT.negro} />
          {quemadores(w, d).map(([x, z, r], i) => <Hornalla key={i} x={x} z={z} r={r} y={h + 0.006} />)}
          {/* panel de perillas + puerta del horno */}
          <Caja w={w - 0.01} h={0.1} d={0.02} p={[0, top - 0.06, d / 2 - 0.01]} mat={MAT.inoxCepillado} />
          <Perillas w={w - 0.08} y={top - 0.06} z={d / 2 + 0.01} n={w > 0.7 ? 6 : 5} />
          <Caja w={w - 0.04} h={top * 0.55} d={0.025} p={[0, top * 0.42, d / 2 - 0.005]} mat={MAT.vidrioOscuro} />
          <Barra y={top * 0.68} z={d / 2 + 0.03} largo={w * 0.75} />
          <Caja w={w - 0.04} h={0.1} d={0.02} p={[0, 0.06, d / 2 - 0.01]} mat={cuerpo} />
        </group>
      )
    }
    case 'anafe': {
      // Apoya sobre la mesada: la placa queda apenas por encima.
      const placa = e.acabado === 'negro' ? MAT.vidrioOscuro : MAT.inox
      return (
        <group>
          <Caja w={w} h={0.008} d={d} p={[0, 0.004, 0]} mat={placa} />
          {e.acabado === 'negro'
            ? quemadores(w, d).map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0.0085, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gris}>
                  <ringGeometry args={[r * 0.9, r, 32]} />
                </mesh>
              ))
            : quemadores(w, d).map(([x, z, r], i) => <Hornalla key={i} x={x} z={z} r={r} y={0.014} />)}
        </group>
      )
    }
    case 'horno': {
      return (
        <group>
          <Caja w={w} h={h} d={0.03} p={[0, h / 2, d / 2 - 0.015]} mat={MAT.inoxCepillado} />
          <Caja w={w - 0.04} h={h * 0.62} d={0.012} p={[0, h * 0.4, d / 2 + 0.006]} mat={MAT.vidrioOscuro} />
          <Caja w={w - 0.04} h={0.06} d={0.012} p={[0, h - 0.05, d / 2 + 0.006]} mat={MAT.negro} />
          <Barra y={h * 0.76} z={d / 2 + 0.035} largo={w * 0.7} />
          <Caja w={w - 0.03} h={h - 0.02} d={d - 0.04} p={[0, h / 2, -0.02]} mat={MAT.interior} sombra={false} />
        </group>
      )
    }
    case 'microondas': {
      return (
        <group>
          <Caja w={w} h={h} d={d} p={[0, h / 2, 0]} mat={cuerpo} />
          <Caja w={w * 0.7} h={h - 0.04} d={0.01} p={[-w * 0.13, h / 2, d / 2 + 0.004]} mat={MAT.vidrioOscuro} />
          <Caja w={w * 0.22} h={h - 0.04} d={0.01} p={[w * 0.37, h / 2, d / 2 + 0.004]} mat={MAT.negro} />
        </group>
      )
    }
    case 'campana': {
      if (h < 0.25) {
        // purificador bajo alacena
        return (
          <group>
            <Caja w={w} h={h} d={d} p={[0, h / 2, 0]} mat={cuerpo} />
            <Caja w={w - 0.04} h={0.004} d={d - 0.04} p={[0, 0.001, 0]} mat={MAT.gris} sombra={false} />
          </group>
        )
      }
      const campana = Math.min(0.12, h)
      const chimenea = Math.max(0.3, h - campana)
      return (
        <group>
          <Caja w={w} h={campana * 0.4} d={d} p={[0, campana * 0.2, 0]} mat={cuerpo} />
          <mesh position={[0, campana * 0.4 + 0.06, -d / 2 + 0.16]} material={cuerpo} castShadow>
            <boxGeometry args={[w * 0.75, 0.12, 0.3]} />
          </mesh>
          <Caja w={0.26} h={chimenea} d={0.22} p={[0, campana + chimenea / 2, -d / 2 + 0.11]} mat={cuerpo} />
          <Caja w={w - 0.04} h={0.004} d={d - 0.04} p={[0, 0.001, 0]} mat={MAT.gris} sombra={false} />
        </group>
      )
    }
    case 'lavavajillas': {
      const panel = e.empotrable ? null : cuerpo
      return (
        <group>
          {panel && <Caja w={w} h={h} d={d - 0.02} p={[0, h / 2, -0.01]} mat={panel} />}
          {e.empotrable && <Caja w={w - 0.006} h={h - est.zocalo * M} d={0.02} p={[0, est.zocalo * M + (h - est.zocalo * M) / 2, d / 2 - 0.01]} mat={MAT.inoxCepillado} />}
          {!e.empotrable && <Caja w={w - 0.006} h={0.08} d={0.02} p={[0, h - 0.05, d / 2]} mat={MAT.negro} />}
          <Barra y={h - 0.13} z={d / 2 + 0.02} largo={w * 0.6} />
        </group>
      )
    }
    case 'lavarropas': {
      return (
        <group>
          <Caja w={w} h={h} d={d} p={[0, h / 2, 0]} mat={cuerpo} />
          <Caja w={w - 0.02} h={0.1} d={0.012} p={[0, h - 0.07, d / 2 + 0.005]} mat={MAT.inoxCepillado} />
          <mesh position={[0, h * 0.45, d / 2 + 0.02]} material={MAT.gris} castShadow>
            <torusGeometry args={[w * 0.27, 0.025, 12, 40]} />
          </mesh>
          <mesh position={[0, h * 0.45, d / 2 + 0.012]} material={MAT.vidrioOscuro}>
            <circleGeometry args={[w * 0.26, 40]} />
          </mesh>
        </group>
      )
    }
    case 'bacha': {
      // Bacha de acero sobre mesada + grifería monocomando detrás.
      const prof = Math.min(0.22, Math.max(0.12, h))
      const dobles = w > 0.72
      const bowls = dobles ? [-w / 4, w / 4] : [0]
      const bw = dobles ? w / 2 - 0.04 : w - 0.06
      return (
        <group>
          <group position={[0, 0.001, 0]}>
            <Caja w={w} h={0.004} d={0.03} p={[0, 0.002, d / 2 - 0.015]} mat={MAT.inox} />
            <Caja w={w} h={0.004} d={0.03} p={[0, 0.002, -d / 2 + 0.015]} mat={MAT.inox} />
            <Caja w={0.03} h={0.004} d={d} p={[-w / 2 + 0.015, 0.002, 0]} mat={MAT.inox} />
            <Caja w={0.03} h={0.004} d={d} p={[w / 2 - 0.015, 0.002, 0]} mat={MAT.inox} />
            {dobles && <Caja w={0.04} h={0.004} d={d} p={[0, 0.002, 0]} mat={MAT.inox} />}
            {bowls.map((x, i) => (
              <group key={i} position={[x, 0, 0]}>
                <Caja w={bw} h={0.003} d={d - 0.06} p={[0, -prof + 0.0015, 0]} mat={MAT.inoxCepillado} sombra={false} />
                <mesh position={[0, -prof / 2, 0]}>
                  <boxGeometry args={[bw, prof, d - 0.06]} />
                  <meshStandardMaterial attach="material" color="#a9adb1" metalness={0.85} roughness={0.35} side={THREE.BackSide} />
                </mesh>
              </group>
            ))}
            {/* grifería */}
            <group position={[0, 0, -d / 2 - 0.025]}>
              <mesh material={MAT.inox} position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.018, 0.3, 16]} />
              </mesh>
              <mesh material={MAT.inox} position={[0, 0.3, 0.09]} rotation={[0, Math.PI / 2, 0]} castShadow>
                <torusGeometry args={[0.09, 0.012, 10, 24, Math.PI]} />
              </mesh>
              <mesh material={MAT.inox} position={[0.035, 0.24, 0]} rotation={[0, 0, Math.PI / 2.4]} castShadow>
                <cylinderGeometry args={[0.006, 0.006, 0.08, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      )
    }
  }
}
