'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { DefDeco, Item } from '@/lib/render/tipos'
import { MATERIALES_PRESET } from '@/lib/render/materiales'
import { cajaUV, M } from './geometria'
import { MAT, material, matColor, texturaArte, texturaFoto } from './texturas'
import { useRender } from './store'

// Objetos de decoración procedurales. Origen: centro de la planta a la altura
// de la base; frente hacia +z. Medidas en metros.

function azar(semilla: number) {
  let s = (semilla * 9301 + 49297) % 233280
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

/** Aclara/oscurece un hex (f < 1 oscurece). */
function tono(hex: string, f: number) {
  const c = new THREE.Color(hex)
  if (f < 1) c.multiplyScalar(f)
  else c.lerp(new THREE.Color('#ffffff'), f - 1)
  return `#${c.getHexString()}`
}

const madera = (color: string) => material({ ...MATERIALES_PRESET['mesada-madera'], color, escala: 0.8 })

function Caja({ w, h, d, p, mat, rot }: { w: number; h: number; d: number; p: [number, number, number]; mat: THREE.Material; rot?: [number, number, number] }) {
  return <mesh geometry={cajaUV(w, h, d)} material={mat} position={p} rotation={rot} castShadow receiveShadow />
}

// ─── Plantas ────────────────────────────────────────────────────────────────

function Maceta({ r, h, color }: { r: number; h: number; color: string }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]} material={matColor(color, 0.75)} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.78, h, 28]} />
      </mesh>
      <mesh position={[0, h - 0.01, 0]} material={matColor('#3b2a1e', 1)}>
        <cylinderGeometry args={[r * 0.94, r * 0.94, 0.01, 24]} />
      </mesh>
    </group>
  )
}

function Hoja({ p, escala, rot, color }: { p: [number, number, number]; escala: [number, number, number]; rot: [number, number, number]; color: string }) {
  return (
    <mesh position={p} rotation={rot} scale={escala} material={matColor(color, 0.65)} castShadow>
      <sphereGeometry args={[1, 10, 8]} />
    </mesh>
  )
}

function Planta({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  const hojas = useMemo(() => {
    const r = azar(def.variante * 31 + 7)
    const verde = def.color2
    const ph = h > 0.6 ? Math.min(0.4, h * 0.3) : h * 0.42
    const top = h - ph
    const out: { p: [number, number, number]; e: [number, number, number]; rot: [number, number, number]; c: string }[] = []
    const v = def.variante
    if (v === 2) {
      // Monstera: hojas grandes en tallos que salen en abanico
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + r() * 0.4
        const rad = w * (0.18 + r() * 0.25)
        const y = ph + top * (0.35 + r() * 0.6)
        out.push({ p: [Math.cos(a) * rad, y, Math.sin(a) * rad], e: [w * 0.2, 0.012, w * 0.15], rot: [r() * 0.6 - 0.3, -a, (r() - 0.5) * 0.8], c: tono(verde, 0.85 + r() * 0.3) })
      }
    } else if (v === 4) {
      // Palmera: hojas largas y finas que se arquean hacia afuera
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + r() * 0.3
        const y = ph + top * (0.45 + r() * 0.5)
        const rad = w * (0.15 + r() * 0.2)
        out.push({ p: [Math.cos(a) * rad, y, Math.sin(a) * rad], e: [w * 0.32, 0.01, 0.035], rot: [0, -a, -0.4 - r() * 0.5], c: tono(verde, 0.85 + r() * 0.3) })
      }
    } else if (v === 6) {
      // Suculenta: roseta
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const rad = w * (i < 6 ? 0.18 : 0.3)
        out.push({ p: [Math.cos(a) * rad, ph + 0.012 + (i < 6 ? 0.012 : 0), Math.sin(a) * rad], e: [w * 0.16, 0.012, w * 0.08], rot: [0, -a, i < 6 ? -0.6 : -0.3], c: tono(verde, 0.9 + (i % 3) * 0.1) })
      }
    } else {
      // Ficus / arbusto: copa de muchas hojas chicas
      const copaY = v === 3 ? ph + top * 0.68 : ph + top * 0.45
      const n = v === 3 ? 60 : 22
      const radio = v === 3 ? w * 0.48 : w * 0.38
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * radio
        const y = copaY + (r() - 0.5) * top * (v === 3 ? 0.5 : 0.6) * (1 - rr / radio * 0.5)
        const s = w * (v === 3 ? 0.05 + r() * 0.05 : 0.08 + r() * 0.07)
        out.push({ p: [Math.cos(a) * rr, y, Math.sin(a) * rr], e: [s, s * 0.45, s * 0.8], rot: [r() * 2, r() * 3, r() * 2], c: tono(verde, 0.7 + r() * 0.35) })
      }
    }
    return { ph, top, out }
  }, [def.variante, def.color2, w, h])

  return (
    <group>
      <Maceta r={w * 0.3} h={hojas.ph} color={def.color} />
      {def.variante === 3 && (
        <mesh position={[0, hojas.ph + hojas.top * 0.3, 0]} material={matColor('#5a4332', 0.9)} castShadow>
          <cylinderGeometry args={[0.012, 0.018, hojas.top * 0.6, 8]} />
        </mesh>
      )}
      {hojas.out.map((x, i) => <Hoja key={i} p={x.p} escala={x.e} rot={x.rot} color={x.c} />)}
    </group>
  )
}

function Aromaticas({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  const r = w / 6.6
  return (
    <group>
      {[-1, 0, 1].map(k => (
        <group key={k} position={[k * w / 3, 0, 0]}>
          <Planta def={{ ...def, variante: 10 + k }} w={r * 3.2} h={h} />
        </group>
      ))}
    </group>
  )
}

// ─── Pared ──────────────────────────────────────────────────────────────────

function Marco({ w, h, d, mat }: { w: number; h: number; d: number; mat: THREE.Material }) {
  const f = Math.min(0.03, w * 0.06)
  return (
    <>
      <Caja w={w} h={f} d={d} p={[0, h - f / 2, 0]} mat={mat} />
      <Caja w={w} h={f} d={d} p={[0, f / 2, 0]} mat={mat} />
      <Caja w={f} h={h - 2 * f} d={d} p={[-w / 2 + f / 2, h / 2, 0]} mat={mat} />
      <Caja w={f} h={h - 2 * f} d={d} p={[w / 2 - f / 2, h / 2, 0]} mat={mat} />
    </>
  )
}

function Cuadro({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    map: def.imagen ? texturaFoto(def.imagen) : texturaArte(def.variante, def.color2),
    roughness: 0.85,
  }), [def.imagen, def.variante, def.color2])
  const f = Math.min(0.03, w * 0.06)
  const pasp = def.imagen ? 0 : Math.min(0.04, w * 0.07)
  return (
    <group>
      <Marco w={w} h={h} d={d} mat={matColor(def.color, 0.5)} />
      <Caja w={w - 2 * f} h={h - 2 * f} d={0.005} p={[0, h / 2, -d / 2 + 0.003]} mat={matColor('#f6f4ef', 0.9)} />
      <mesh position={[0, h / 2, -d / 2 + 0.007]} material={mat}>
        <planeGeometry args={[w - 2 * f - 2 * pasp, h - 2 * f - 2 * pasp]} />
      </mesh>
    </group>
  )
}

function Espejo({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  return (
    <group>
      <Marco w={w} h={h} d={d} mat={matColor(def.color, 0.4, 0.3)} />
      <mesh position={[0, h / 2, -d / 2 + 0.008]}>
        <planeGeometry args={[w - 0.05, h - 0.05]} />
        <meshStandardMaterial color="#dfe7ea" metalness={1} roughness={0.03} />
      </mesh>
    </group>
  )
}

function Reloj({ def, w, d }: { def: DefDeco; w: number; d: number }) {
  const r = w / 2
  return (
    <group position={[0, r, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={matColor(def.color, 0.4, 0.4)} castShadow>
        <cylinderGeometry args={[r, r, d, 40]} />
      </mesh>
      <mesh position={[0, 0, d / 2 + 0.001]} material={matColor(def.color2, 0.6)}>
        <circleGeometry args={[r * 0.88, 40]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <mesh key={i} position={[Math.sin(a) * r * 0.75, Math.cos(a) * r * 0.75, d / 2 + 0.003]} rotation={[0, 0, -a]} material={MAT.negro}><boxGeometry args={[0.006, i % 3 ? 0.015 : 0.03, 0.002]} /></mesh>
      })}
      <mesh position={[0.03, 0.04, d / 2 + 0.006]} rotation={[0, 0, -0.65]} material={MAT.negro}><boxGeometry args={[0.008, r * 0.55, 0.003]} /></mesh>
      <mesh position={[-0.05, -0.02, d / 2 + 0.008]} rotation={[0, 0, 1.9]} material={MAT.negro}><boxGeometry args={[0.005, r * 0.75, 0.003]} /></mesh>
    </group>
  )
}

const LOMOS = ['#c0272d', '#2f4b56', '#e4d9c6', '#6f7552', '#1e1e1e', '#d97b4a', '#b7c2ae', '#7a5639']

function Libros({ ancho, prof, alto, semilla, color, color2 }: { ancho: number; prof: number; alto: number; semilla: number; color: string; color2: string }) {
  const r = azar(semilla)
  const out: React.ReactNode[] = []
  let x = -ancho / 2
  let i = 0
  while (x < ancho / 2 - 0.02) {
    const t = 0.025 + r() * 0.03
    const h = alto * (0.75 + r() * 0.25)
    const c = i === 0 ? color : i === 1 ? color2 : LOMOS[Math.floor(r() * LOMOS.length)]
    out.push(<Caja key={i} w={t} h={h} d={prof * (0.8 + r() * 0.2)} p={[x + t / 2, h / 2, 0]} mat={matColor(c, 0.8)} />)
    x += t + 0.002
    i++
  }
  return <>{out}</>
}

function Estante({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  return (
    <group>
      <Caja w={w} h={0.03} d={d} p={[0, 0.015, 0]} mat={madera(def.color)} />
      <group position={[-w / 4, 0.03, 0]}>
        <Libros ancho={w * 0.45} prof={d * 0.8} alto={Math.min(0.24, h - 0.03)} semilla={def.variante} color={def.color2} color2="#2f4b56" />
      </group>
      <group position={[w * 0.28, 0.03, 0]}>
        <Planta def={{ ...def, color: '#f2f1ec', color2: '#4f7a3a', variante: 5 }} w={Math.min(0.14, d * 0.7)} h={Math.min(0.22, h)} />
      </group>
    </group>
  )
}

// ─── Comedor ────────────────────────────────────────────────────────────────

function MesaRect({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  const pata = matColor(def.color, 0.5, 0.4)
  const e = 0.035
  return (
    <group>
      <Caja w={w} h={e} d={d} p={[0, h - e / 2, 0]} mat={madera(def.color2)} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Caja key={i} w={0.045} h={h - e} d={0.045} p={[sx * (w / 2 - 0.07), (h - e) / 2, sz * (d / 2 - 0.07)]} mat={pata} />
      ))}
      <Caja w={w - 0.2} h={0.06} d={0.02} p={[0, h - e - 0.03, -d / 2 + 0.08]} mat={pata} />
      <Caja w={w - 0.2} h={0.06} d={0.02} p={[0, h - e - 0.03, d / 2 - 0.08]} mat={pata} />
    </group>
  )
}

function MesaRedonda({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  return (
    <group>
      <mesh position={[0, h - 0.015, 0]} material={madera(def.color2)} castShadow receiveShadow><cylinderGeometry args={[w / 2, w / 2, 0.03, 48]} /></mesh>
      <mesh position={[0, (h - 0.03) / 2, 0]} material={matColor(def.color, 0.5, 0.4)} castShadow><cylinderGeometry args={[0.04, 0.05, h - 0.03, 16]} /></mesh>
      <mesh position={[0, 0.015, 0]} material={matColor(def.color, 0.5, 0.4)} castShadow receiveShadow><cylinderGeometry args={[w * 0.25, w * 0.27, 0.03, 32]} /></mesh>
    </group>
  )
}

function Silla({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  const est = matColor(def.color, 0.5, 0.3)
  const asiento = 0.46
  return (
    <group>
      <Caja w={w} h={0.04} d={d * 0.92} p={[0, asiento, 0.01]} mat={madera(def.color2)} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Caja key={i} w={0.028} h={sz < 0 ? h : asiento} d={0.028} p={[sx * (w / 2 - 0.03), (sz < 0 ? h : asiento) / 2, sz * (d / 2 - 0.04)]} mat={est} />
      ))}
      <Caja w={w - 0.04} h={0.14} d={0.02} p={[0, h - 0.1, -d / 2 + 0.04]} mat={madera(def.color2)} />
      <Caja w={w - 0.06} h={0.025} d={0.02} p={[0, asiento + 0.15, -d / 2 + 0.04]} mat={est} />
    </group>
  )
}

function Banqueta({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  const est = matColor(def.color, 0.45, 0.5)
  return (
    <group>
      <mesh position={[0, h - 0.025, 0]} material={madera(def.color2)} castShadow receiveShadow><cylinderGeometry args={[w / 2, w / 2.2, 0.05, 32]} /></mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh key={i} position={[Math.cos(a) * w * 0.3, (h - 0.05) / 2, Math.sin(a) * w * 0.3]} rotation={[Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08]} material={est} castShadow>
            <cylinderGeometry args={[0.012, 0.012, h - 0.05, 8]} />
          </mesh>
        )
      })}
      <mesh position={[0, h * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={est}><torusGeometry args={[w * 0.34, 0.008, 8, 32]} /></mesh>
    </group>
  )
}

// ─── Ambiente ───────────────────────────────────────────────────────────────

function Alfombra({ def, w, d }: { def: DefDeco; w: number; d: number }) {
  const base = material({ ...MATERIALES_PRESET.arena, textura: 'lino', color: def.color, escala: 0.4, rugosidad: 1 })
  const centro = material({ ...MATERIALES_PRESET.arena, textura: 'lino', color: def.color2, escala: 0.4, rugosidad: 1 })
  const borde = Math.min(0.12, w * 0.08)
  return (
    <group>
      <Caja w={w} h={0.008} d={d} p={[0, 0.004, 0]} mat={base} />
      <Caja w={w - 2 * borde} h={0.002} d={d - 2 * borde} p={[0, 0.009, 0]} mat={centro} />
    </group>
  )
}

function Colgante({ def, w, h, elev }: { def: DefDeco; w: number; h: number; elev: number }) {
  const techo = useRender(s => s.escena.ambiente.alto) * M
  const cable = Math.max(0.05, techo - elev * M - h)
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.03, w / 2, h, 32, 1, true]} />
        <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h + cable / 2, 0]} material={MAT.negro}><cylinderGeometry args={[0.003, 0.003, cable, 6]} /></mesh>
      <mesh position={[0, h * 0.25, 0]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshBasicMaterial color={def.color2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, h * 0.1, 0]} color={def.color2} intensity={2.5} distance={0} decay={2} />
    </group>
  )
}

// ─── Adornos ────────────────────────────────────────────────────────────────

function Jarron({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  const hv = Math.min(h * 0.5, 0.25)
  const perfil = useMemo(() => {
    const r = w / 2
    return [[0.001, 0], [r * 0.7, 0], [r, hv * 0.35], [r * 0.85, hv * 0.75], [r * 0.5, hv * 0.92], [r * 0.6, hv]].map(([x, y]) => new THREE.Vector2(x, y))
  }, [w, hv])
  const flores = useMemo(() => {
    const r = azar(def.variante + 3)
    return Array.from({ length: 7 }, () => ({ a: r() * Math.PI * 2, inc: 0.12 + r() * 0.25, l: (h - hv) * (0.7 + r() * 0.3), s: 0.02 + r() * 0.015 }))
  }, [def.variante, h, hv])
  return (
    <group>
      <mesh material={matColor(def.color, 0.25, 0.1)} castShadow><latheGeometry args={[perfil, 32]} /></mesh>
      {flores.map((f, i) => {
        const dx = Math.sin(f.inc) * Math.cos(f.a) * f.l, dz = Math.sin(f.inc) * Math.sin(f.a) * f.l, dy = Math.cos(f.inc) * f.l
        return (
          <group key={i} position={[0, hv * 0.9, 0]}>
            <mesh position={[dx / 2, dy / 2, dz / 2]} rotation={[Math.sin(f.a) * f.inc, 0, -Math.cos(f.a) * f.inc]} material={matColor('#4f7a3a', 0.8)}>
              <cylinderGeometry args={[0.002, 0.002, f.l, 5]} />
            </mesh>
            <mesh position={[dx, dy, dz]} material={matColor(i % 3 ? def.color2 : '#f2f1ec', 0.7)} castShadow><sphereGeometry args={[f.s, 10, 8]} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

const FRUTAS = ['#e8862b', '#d63a2f', '#e9c93f', '#8cb84a', '#e8862b', '#d63a2f']

function Frutero({ def, w, h }: { def: DefDeco; w: number; h: number }) {
  const r = w / 2
  const frutas = useMemo(() => {
    const a = azar(def.variante + 11)
    return Array.from({ length: 7 }, (_, i) => ({ x: (a() - 0.5) * r, z: (a() - 0.5) * r, y: h * 0.45 + (i > 4 ? 0.05 : 0), s: 0.035 + a() * 0.012, c: FRUTAS[i % FRUTAS.length] }))
  }, [def.variante, r, h])
  return (
    <group>
      <mesh position={[0, h * 0.95, 0]} rotation={[Math.PI, 0, 0]} scale={[1, h / r, 1]} castShadow receiveShadow>
        <sphereGeometry args={[r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={def.color} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {frutas.map((f, i) => <mesh key={i} position={[f.x, f.y, f.z]} material={matColor(f.c, 0.45)} castShadow><sphereGeometry args={[f.s, 14, 10]} /></mesh>)}
    </group>
  )
}

function Cafetera({ def, w, h, d }: { def: DefDeco; w: number; h: number; d: number }) {
  const c = matColor(def.color, 0.35, 0.3)
  return (
    <group>
      <Caja w={w} h={0.04} d={d} p={[0, 0.02, 0]} mat={c} />
      <Caja w={w} h={h - 0.04} d={d * 0.4} p={[0, h / 2, -d * 0.3]} mat={c} />
      <Caja w={w} h={0.05} d={d * 0.7} p={[0, h - 0.025, -d * 0.15]} mat={c} />
      <mesh position={[0, 0.04 + h * 0.2, d * 0.12]} castShadow>
        <cylinderGeometry args={[w * 0.32, w * 0.36, h * 0.4, 24]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

export default function Deco3D({ it }: { it: Item }) {
  const def = it.deco!
  const w = def.ancho * M, h = def.alto * M, d = def.profundidad * M
  switch (def.tipo) {
    case 'planta': return <Planta def={def} w={w} h={h} />
    case 'aromaticas': return <Aromaticas def={def} w={w} h={h} />
    case 'cuadro': return <Cuadro def={def} w={w} h={h} d={d} />
    case 'espejo': return <Espejo def={def} w={w} h={h} d={d} />
    case 'reloj': return <Reloj def={def} w={w} d={d} />
    case 'estante': return <Estante def={def} w={w} h={h} d={d} />
    case 'mesa-rect': return <MesaRect def={def} w={w} h={h} d={d} />
    case 'mesa-redonda': return <MesaRedonda def={def} w={w} h={h} />
    case 'silla': return <Silla def={def} w={w} h={h} d={d} />
    case 'banqueta': return <Banqueta def={def} w={w} h={h} />
    case 'alfombra': return <Alfombra def={def} w={w} d={d} />
    case 'colgante': return <Colgante def={def} w={w} h={h} elev={it.elevacion} />
    case 'jarron': return <Jarron def={def} w={w} h={h} />
    case 'frutero': return <Frutero def={def} w={w} h={h} />
    case 'libros': return <Libros ancho={w} prof={d} alto={h} semilla={def.variante} color={def.color} color2={def.color2} />
    case 'tabla': return (
      <group>
        <Caja w={w} h={h} d={d} p={[0, h / 2, 0]} mat={madera(def.color)} />
        <mesh position={[w / 2 - 0.04, h + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.interior}><circleGeometry args={[0.012, 16]} /></mesh>
      </group>
    )
    case 'cafetera': return <Cafetera def={def} w={w} h={h} d={d} />
  }
}
